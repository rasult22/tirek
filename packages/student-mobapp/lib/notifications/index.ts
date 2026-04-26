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
import { useT } from "../hooks/useLanguage";
import { scheduleEveningPrompt } from "./evening-prompt";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and return the Expo push token.
 * On simulators / emulators this will return undefined.
 */
export async function registerForPushNotifications(): Promise<string | undefined> {
  if (!Device.isDevice) {
    return undefined;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return undefined;
  }

  // Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Tirek",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    // Dev build without EAS — push tokens unavailable
    return undefined;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return tokenData.data;
}

/**
 * Send push token to backend for storage.
 */
async function registerTokenOnServer(pushToken: string) {
  try {
    await tirekClient.pushToken.register({
      token: pushToken,
      platform: Platform.OS,
    });
  } catch {
    // Non-critical — token registration can retry later
  }
}

type NotificationType =
  | "direct_message"
  | "test_assigned"
  | "test_result"
  | "crisis_alert"
  | "evening_prompt";

interface NotificationData {
  type?: NotificationType;
  conversationId?: string;
  testSessionId?: string;
}

/**
 * Hook: handles push token registration and notification tap navigation.
 * Call once in root layout.
 */
/**
 * Invalidate relevant React Query caches based on notification type.
 */
function invalidateCacheForNotification(
  queryClient: ReturnType<typeof useQueryClient>,
  data: NotificationData | undefined,
) {
  if (!data?.type) return;

  switch (data.type) {
    case "direct_message":
      queryClient.invalidateQueries({ queryKey: ["direct-chat", "unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["direct-chat", "conversations"] });
      if (data.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["direct-chat", "messages", data.conversationId],
        });
      }
      break;
    case "test_assigned":
      queryClient.invalidateQueries({ queryKey: ["tests", "assigned"] });
      break;
    case "test_result":
      queryClient.invalidateQueries({ queryKey: ["tests", "assigned"] });
      break;
  }
}

export function useNotifications() {
  const { push } = useRouter();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const t = useT();
  const receivedListener = useRef<EventSubscription>(null);
  const responseListener = useRef<EventSubscription>(null);

  useEffect(() => {
    if (!token) return;

    // Register push token (для серверных пушей: чаты, тесты, кризис)
    registerForPushNotifications().then((pushToken) => {
      if (pushToken) {
        registerTokenOnServer(pushToken);
      }
    });

    // Schedule local evening mood prompt (не зависит от push token)
    scheduleEveningPrompt({
      title: t.mood.eveningPromptTitle,
      body: t.mood.eveningPromptBody,
    }).catch(() => {});

    // Handle notification received (foreground) — refresh data
    receivedListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data as NotificationData;
        invalidateCacheForNotification(queryClient, data);
      });

    // Handle notification tap — navigate to relevant screen
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content
          .data as NotificationData;

        // Also invalidate cache on tap
        invalidateCacheForNotification(queryClient, data);

        switch (data?.type) {
          case "direct_message":
            if (data.conversationId) {
              push(`/(screens)/messages/${data.conversationId}`);
            } else {
              push("/(screens)/messages");
            }
            break;
          case "test_result":
            if (data.testSessionId) {
              push(
                `/(screens)/tests/results/${data.testSessionId}` as any,
              );
            }
            break;
          case "test_assigned":
            push("/(tabs)/diagnostics");
            break;
          case "crisis_alert":
            push("/(screens)/sos");
            break;
          case "evening_prompt":
            push("/(tabs)/mood");
            break;
        }
      });

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [token, push, queryClient]);
}
