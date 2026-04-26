// Compile-time tagged-union spec for CrisisSignalInput.
// Validated by `tsc --noEmit`. Intentionally has no runtime assertions —
// it exists to lock the discriminated union shape.

import type { CrisisSignalInput } from "./index.js";

// ── Valid shapes compile ────────────────────────────────────────────
const _validUrgentHelp: CrisisSignalInput = {
  source: "urgent_help",
  userId: "stu-1",
};

const _validUrgentHelpWithMetadata: CrisisSignalInput = {
  source: "urgent_help",
  userId: "stu-1",
  metadata: { triggeredFrom: "sos_screen" },
};

const _validAiFriend: CrisisSignalInput = {
  source: "ai_friend",
  userId: "stu-1",
  conversationId: "sess-1",
  type: "acute_crisis",
  severity: "high",
  summary: "Signal Summary in psychologist language",
};

const _validAiFriendWithCategory: CrisisSignalInput = {
  source: "ai_friend",
  userId: "stu-1",
  conversationId: "sess-1",
  type: "concern",
  severity: "medium",
  summary: "s",
  category: "bullying",
  markers: ["m"],
};

const _validTestSession: CrisisSignalInput = {
  source: "test_session",
  userId: "stu-1",
  testSessionId: "sess-42",
  testSlug: "phq-a",
  testSeverity: "severe",
  flaggedItems: [{ questionIndex: 9, reason: "suicidal_ideation" }],
};

// ── Invalid shapes must NOT compile ─────────────────────────────────

// urgent_help missing userId
// @ts-expect-error userId is required for urgent_help
const _missingUserId: CrisisSignalInput = { source: "urgent_help" };

// ai_friend missing conversationId
// @ts-expect-error conversationId is required for ai_friend
const _missingConversationId: CrisisSignalInput = {
  source: "ai_friend",
  userId: "stu-1",
  type: "acute_crisis",
  severity: "high",
  summary: "s",
};

// ai_friend missing summary
// @ts-expect-error summary is required for ai_friend
const _missingSummary: CrisisSignalInput = {
  source: "ai_friend",
  userId: "stu-1",
  conversationId: "x",
  type: "acute_crisis",
  severity: "high",
};

// test_session missing flaggedItems
// @ts-expect-error flaggedItems is required for test_session
const _missingFlaggedItems: CrisisSignalInput = {
  source: "test_session",
  userId: "stu-1",
  testSessionId: "x",
  testSlug: "y",
  testSeverity: "severe",
};

// test_session with non-'severe' testSeverity
const _wrongTestSeverity: CrisisSignalInput = {
  source: "test_session",
  userId: "stu-1",
  testSessionId: "x",
  testSlug: "y",
  // @ts-expect-error testSeverity must be the literal "severe"
  testSeverity: "moderate",
  flaggedItems: [],
};

// urgent_help cannot carry ai_friend fields (no field bleed across variants)
const _typeOnUrgentHelp: CrisisSignalInput = {
  source: "urgent_help",
  userId: "stu-1",
  // @ts-expect-error type is not a valid field on urgent_help
  type: "acute_crisis",
};

// Suppress unused locals
void [
  _validUrgentHelp,
  _validUrgentHelpWithMetadata,
  _validAiFriend,
  _validAiFriendWithCategory,
  _validTestSession,
  _missingUserId,
  _missingConversationId,
  _missingSummary,
  _missingFlaggedItems,
  _wrongTestSeverity,
  _typeOnUrgentHelp,
];
