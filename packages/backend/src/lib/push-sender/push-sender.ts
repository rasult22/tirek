// Deep module: тонкая обёртка над expo-server-sdk.
// Принимает массив сообщений {to, title, body, data}, возвращает invalidTokens
// (DeviceNotRegistered + не-Expo формат) — вызывающий чистит push_tokens.

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

export type PushTicket =
  | { status: "ok"; id: string }
  | {
      status: "error";
      message: string;
      details?: { error?: string };
    };

// Минимальный contract Expo SDK, который мы используем — позволяет мокать в тестах.
export type ExpoLike = {
  isExpoPushToken(token: string): boolean;
  chunkPushNotifications(messages: PushMessage[]): PushMessage[][];
  sendPushNotificationsAsync(chunk: PushMessage[]): Promise<PushTicket[]>;
};

export type PushSenderDeps = {
  expo: ExpoLike;
  logger?: { warn: (msg: string, ctx?: Record<string, unknown>) => void };
};

export type SendResult = {
  invalidTokens: string[];
};

export function createPushSender(deps: PushSenderDeps) {
  const logger = deps.logger ?? {
    warn: (msg, ctx) => console.warn(`[push-sender] ${msg}`, ctx ?? {}),
  };

  return {
    async send(messages: PushMessage[]): Promise<SendResult> {
      if (messages.length === 0) return { invalidTokens: [] };

      const invalidTokens: string[] = [];
      const valid: PushMessage[] = [];
      for (const m of messages) {
        if (deps.expo.isExpoPushToken(m.to)) {
          valid.push(m);
        } else {
          invalidTokens.push(m.to);
        }
      }
      if (valid.length === 0) return { invalidTokens };

      const chunks = deps.expo.chunkPushNotifications(valid);
      for (const chunk of chunks) {
        try {
          const tickets = await deps.expo.sendPushNotificationsAsync(chunk);
          tickets.forEach((ticket, i) => {
            if (
              ticket.status === "error" &&
              ticket.details?.error === "DeviceNotRegistered"
            ) {
              const token = chunk[i]?.to;
              if (token) invalidTokens.push(token);
            }
          });
        } catch (err) {
          logger.warn(
            `chunk send failed: ${(err as Error).message}`,
            { size: chunk.length },
          );
        }
      }

      return { invalidTokens };
    },
  };
}
