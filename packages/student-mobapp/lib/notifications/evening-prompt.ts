import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  nextEveningPromptAt,
  nextDayEveningPromptAt,
  isEveningSlot,
} from "@tirek/shared/evening-prompt";

const EVENING_PROMPT_IDENTIFIER = "evening-mood-prompt";

type EveningPromptCopy = {
  title: string;
  body: string;
};

async function ensurePermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function scheduleAt(fireAt: Date, copy: EveningPromptCopy): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(EVENING_PROMPT_IDENTIFIER).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_PROMPT_IDENTIFIER,
    content: {
      title: copy.title,
      body: copy.body,
      data: { type: "evening_prompt" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });
}

export async function scheduleEveningPrompt(copy: EveningPromptCopy): Promise<void> {
  if (Platform.OS === "web") return;
  if (!(await ensurePermission())) return;
  await scheduleAt(nextEveningPromptAt(new Date()), copy);
}

export async function rescheduleEveningPromptAfterCheckIn(input: {
  entryCreatedAt: Date;
  copy: EveningPromptCopy;
}): Promise<void> {
  if (Platform.OS === "web") return;
  // Day Slot не отменяет вечерний пуш — он по-прежнему нужен сегодня.
  if (!isEveningSlot(input.entryCreatedAt)) return;
  if (!(await ensurePermission())) return;
  await scheduleAt(nextDayEveningPromptAt(input.entryCreatedAt), input.copy);
}

export async function cancelEveningPrompt(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(EVENING_PROMPT_IDENTIFIER).catch(() => {});
}
