import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { EventSubscription } from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/auth-store";
import { apiFetch } from "../api/client";

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
    await apiFetch("/student/push-token", {
      method: "POST",
      body: JSON.stringify({
        token: pushToken,
        platform: Platform.OS,
      }),
    });
  } catch {
    // Non-critical — token registration can retry later
  }
}

type NotificationType =
  | "direct_message"
  | "appointment_reminder"
  | "test_result"
  | "crisis_alert";

interface NotificationData {
  type?: NotificationType;
  conversationId?: string;
  appointmentId?: string;
  testSessionId?: string;
}

/**
 * Hook: handles push token registration and notification tap navigation.
 * Call once in root layout.
 */
export function useNotifications() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const responseListener = useRef<EventSubscription>(null);

  useEffect(() => {
    if (!token) return;

    // Register push token
    registerForPushNotifications().then((pushToken) => {
      if (pushToken) {
        registerTokenOnServer(pushToken);
      }
    });

    // Handle notification tap — navigate to relevant screen
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content
          .data as NotificationData;

        switch (data?.type) {
          case "direct_message":
            if (data.conversationId) {
              router.push(`/(screens)/messages/${data.conversationId}`);
            } else {
              router.push("/(screens)/messages");
            }
            break;
          case "appointment_reminder":
            router.push("/(screens)/appointments");
            break;
          case "test_result":
            if (data.testSessionId) {
              router.push(
                `/(screens)/tests/results/${data.testSessionId}` as any,
              );
            }
            break;
          case "crisis_alert":
            router.push("/(screens)/sos");
            break;
        }
      });

    return () => {
      responseListener.current?.remove();
    };
  }, [token, router]);
}
