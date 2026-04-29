import { evaluatePushPolicy } from "../../lib/push-notification-policy/push-notification-policy.js";
import type { PushSignalKind } from "../../lib/push-notification-policy/push-notification-policy.js";
import type { ResolverOutput } from "../../lib/office-hours/resolver.js";
import type { PushMessage, SendResult } from "../../lib/push-sender/push-sender.js";
import type { PushTokenRecord } from "../push-tokens/push-tokens.factory.js";

export type DispatchEvent = {
  kind: PushSignalKind;
  recipientUserId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  currentTime: Date;
};

export type PushDispatcherDeps = {
  getTokensForUser(userId: string): Promise<PushTokenRecord[]>;
  resolveOfficeHoursForDate(
    psychologistId: string,
    date: string,
  ): Promise<ResolverOutput>;
  sendPush(messages: PushMessage[]): Promise<SendResult>;
  removeToken(token: string): Promise<void>;
  almatyDayFor(currentTime: Date): string;
  logger: {
    warn: (msg: string, ctx?: Record<string, unknown>) => void;
    info: (msg: string, ctx?: Record<string, unknown>) => void;
  };
};

const RECIPIENT_IS_PSYCHOLOGIST: Record<PushSignalKind, boolean> = {
  crisis_signal_red: true,
  crisis_signal_yellow: true,
  message_from_crisis_student: true,
  message_from_normal_student: true,
  message_from_psychologist: false, // получатель = ученик, OH не применяем
};

export function createPushDispatcher(deps: PushDispatcherDeps) {
  return {
    async dispatch(event: DispatchEvent): Promise<void> {
      const tokens = await deps.getTokensForUser(event.recipientUserId);
      if (tokens.length === 0) {
        deps.logger.info("no tokens for recipient — skip", {
          recipientUserId: event.recipientUserId,
          kind: event.kind,
        });
        return;
      }

      // Резолвим OH только если получатель — психолог.
      let officeHours: { start: string; end: string }[] = [];
      if (RECIPIENT_IS_PSYCHOLOGIST[event.kind]) {
        const date = deps.almatyDayFor(event.currentTime);
        const resolved = await deps.resolveOfficeHoursForDate(
          event.recipientUserId,
          date,
        );
        officeHours = resolved.intervals;
      }

      const decision = evaluatePushPolicy({
        kind: event.kind,
        currentTime: event.currentTime,
        recipientOfficeHours: officeHours,
      });

      if (!decision.shouldPush) {
        deps.logger.info("push skipped by policy", {
          kind: event.kind,
          reason: decision.reason,
          recipientUserId: event.recipientUserId,
        });
        return;
      }

      const messages: PushMessage[] = tokens.map((t) => ({
        to: t.token,
        title: event.title,
        body: event.body,
        data: event.data,
        sound: "default",
      }));

      const result = await deps.sendPush(messages);

      // Чистим невалидные токены.
      for (const token of result.invalidTokens) {
        try {
          await deps.removeToken(token);
        } catch (err) {
          deps.logger.warn(
            `failed to remove invalid token: ${(err as Error).message}`,
            { token },
          );
        }
      }
    },
  };
}
