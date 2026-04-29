import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { EventSubscription } from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth-store";
import { tirekClient } from "../api/client";

// Foreground notification behavior — баннер + звук + bage.
// Психологу важно не пропустить кризис, поэтому показываем агрессивно.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications(): Promise<string | undefined> {
  if (!Device.isDevice) return undefined;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return undefined;

  if (Platform.OS === "android") {
    // Канал "crisis" с максимальной важностью — для red-сигналов 24/7.
    await Notifications.setNotificationChannelAsync("crisis", {
      name: "Кризисные сигналы",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    await Notifications.setNotificationChannelAsync("default", {
      name: "Tirek",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return undefined;

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

async function registerTokenOnServer(pushToken: string) {
  try {
    await tirekClient.psychologist.pushToken.register({
      token: pushToken,
      platform: Platform.OS,
    });
  } catch {
    // Не критично — клиент попробует ещё раз при следующем входе.
  }
}

type NotificationType =
  | "crisis_alert"
  | "direct_message";

interface NotificationData {
  type?: NotificationType;
  signalId?: string;
  studentId?: string;
  conversationId?: string;
}

function invalidateCacheForNotification(
  queryClient: ReturnType<typeof useQueryClient>,
  data: NotificationData | undefined,
) {
  if (!data?.type) return;
  switch (data.type) {
    case "crisis_alert":
      queryClient.invalidateQueries({ queryKey: ["crisis", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["crisis", "counts"] });
      break;
    case "direct_message":
      queryClient.invalidateQueries({ queryKey: ["direct-chat", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["direct-chat", "conversations"] });
      if (data.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["direct-chat", "messages", data.conversationId],
        });
      }
      break;
  }
}

export function useNotifications() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const receivedListener = useRef<EventSubscription>(null);
  const responseListener = useRef<EventSubscription>(null);

  useEffect(() => {
    if (!token) return;

    registerForPushNotifications().then((pushToken) => {
      if (pushToken) registerTokenOnServer(pushToken);
    });

    receivedListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as NotificationData;
        invalidateCacheForNotification(queryClient, data);
      },
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content
          .data as NotificationData;
        invalidateCacheForNotification(queryClient, data);

        switch (data?.type) {
          case "crisis_alert":
            router.push("/(tabs)/crisis");
            break;
          case "direct_message":
            if (data.conversationId) {
              router.push(`/(screens)/messages/${data.conversationId}` as never);
            } else {
              router.push("/(tabs)/messages");
            }
            break;
        }
      });

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [token, router, queryClient]);
}
