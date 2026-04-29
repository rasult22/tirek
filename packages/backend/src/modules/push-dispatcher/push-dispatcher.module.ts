import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";

import { currentDay } from "../../lib/almaty-day/almaty-day.js";
import {
  createPushSender,
  type PushMessage,
  type PushTicket,
} from "../../lib/push-sender/push-sender.js";
import { officeHoursService } from "../office-hours/office-hours.service.js";
import { pushTokensService } from "../push-tokens/push-tokens.module.js";
import { createPushDispatcher } from "./push-dispatcher.js";

const expo = new Expo();

function toExpoMessages(msgs: PushMessage[]): ExpoPushMessage[] {
  return msgs.map((m) => ({
    to: m.to,
    title: m.title,
    body: m.body,
    data: m.data,
    sound: m.sound ?? null,
  }));
}

function fromExpoTicket(t: ExpoPushTicket): PushTicket {
  if (t.status === "ok") return { status: "ok", id: t.id };
  return {
    status: "error",
    message: t.message,
    details: t.details ? { error: (t.details as { error?: string }).error } : undefined,
  };
}

const pushSender = createPushSender({
  expo: {
    isExpoPushToken: (t) => Expo.isExpoPushToken(t),
    chunkPushNotifications: (msgs) => {
      const chunks = expo.chunkPushNotifications(toExpoMessages(msgs));
      // Возвращаем chunked PushMessage[][] — пересобираем по индексам.
      let i = 0;
      return chunks.map((chunk) => {
        const out: PushMessage[] = [];
        for (let k = 0; k < chunk.length; k++) {
          out.push(msgs[i + k]!);
        }
        i += chunk.length;
        return out;
      });
    },
    sendPushNotificationsAsync: async (chunk) => {
      const tickets = await expo.sendPushNotificationsAsync(toExpoMessages(chunk));
      return tickets.map(fromExpoTicket);
    },
  },
});

export const pushDispatcher = createPushDispatcher({
  getTokensForUser: (userId) => pushTokensService.getTokensForUser(userId),
  resolveOfficeHoursForDate: (psychologistId, date) =>
    // admin role bypass — dispatcher не проверяет авторизацию, ему дают валидного получателя.
    officeHoursService.resolveForDate("system", "admin", psychologistId, date),
  sendPush: (messages) => pushSender.send(messages),
  removeToken: (token) => pushTokensService.removeToken(token),
  almatyDayFor: (now) => currentDay(now),
  logger: {
    warn: (msg, ctx) => console.warn(`[push-dispatcher] ${msg}`, ctx ?? {}),
    info: (msg, ctx) => console.info(`[push-dispatcher] ${msg}`, ctx ?? {}),
  },
});
