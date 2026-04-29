import type { Interval } from '../office-hours/availability.js';

export type PushSignalKind =
  | 'crisis_signal_red'
  | 'crisis_signal_yellow'
  | 'message_from_crisis_student'
  | 'message_from_normal_student'
  | 'message_from_psychologist';

export type PolicyInput = {
  kind: PushSignalKind;
  currentTime: Date;
  recipientOfficeHours: Interval[];
};

export type PolicyOutput = {
  shouldPush: boolean;
  reason: string;
};

const hhmmFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Almaty',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function isInsideOfficeHours(currentTime: Date, intervals: Interval[]): boolean {
  const nowHm = hhmmFormatter.format(currentTime);
  return intervals.some((i) => nowHm >= i.start && nowHm < i.end);
}

export function evaluatePushPolicy(input: PolicyInput): PolicyOutput {
  if (input.kind === 'crisis_signal_red') {
    return { shouldPush: true, reason: 'red crisis signal — push 24/7' };
  }
  if (input.kind === 'crisis_signal_yellow') {
    if (isInsideOfficeHours(input.currentTime, input.recipientOfficeHours)) {
      return { shouldPush: true, reason: 'yellow signal inside office hours' };
    }
    return {
      shouldPush: false,
      reason: 'yellow signal outside office hours — no push',
    };
  }
  if (input.kind === 'message_from_crisis_student') {
    return {
      shouldPush: true,
      reason: 'message from crisis student — push 24/7',
    };
  }
  if (input.kind === 'message_from_normal_student') {
    if (isInsideOfficeHours(input.currentTime, input.recipientOfficeHours)) {
      return { shouldPush: true, reason: 'normal message inside office hours' };
    }
    return {
      shouldPush: false,
      reason: 'normal message outside office hours — no push',
    };
  }
  return { shouldPush: true, reason: 'message from psychologist — always push' };
}
