export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export type UserRole = "student" | "psychologist" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  language: "ru" | "kz";
  avatarId: string | null;
  grade: number | null;
  classLetter: string | null;
  schoolId: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: number | null;
  sleepQuality: number | null;
  stressLevel: number | null;
  note: string | null;
  factors: string[] | null;
  createdAt: string;
}

export interface MoodCalendarDay {
  date: string;
  daySlotMood: number | null;
  eveningSlotMood: number | null;
}

export interface MoodToday {
  daySlot: MoodEntry | null;
  eveningSlot: MoodEntry | null;
}

export interface MoodInsights {
  weeklyAverage: number;
  trend: "improving" | "stable" | "declining";
  topFactors: string[];
}

export type Severity = "minimal" | "mild" | "moderate" | "severe";

export interface DiagnosticTest {
  id: string;
  slug: string;
  nameRu: string;
  nameKz: string;
  description: string;
  questionCount: number;
}

export interface TestQuestion {
  index: number;
  textRu: string;
  textKz: string;
  options: TestOption[];
}

export interface TestOption {
  value: number;
  labelRu: string;
  labelKz: string;
}

export interface DiagnosticSession {
  id: string;
  userId: string;
  testId: string;
  startedAt: string;
  completedAt: string | null;
  totalScore: number | null;
  maxScore: number | null;
  severity: Severity | null;
}

export type AssignmentStatus = "not_started" | "in_progress" | "completed";

export interface AssignedTest {
  assignmentId: string;
  testId: string;
  dueDate: string | null;
  status: AssignmentStatus;
  completedSessionId: string | null;
  overdue: boolean;
  assignedAt: string;
  test: {
    id: string;
    slug: string;
    nameRu: string;
    nameKz: string | null;
    description: string | null;
    questionCount: number;
  } | null;
}

export type AiReportStatus = "pending" | "ready" | "error";

export interface AiReportRiskFactor {
  factor: string;
  severity: "low" | "moderate" | "high";
  evidence?: string;
}

export type AiReportRecommendationType =
  | "therapy"
  | "exercise"
  | "referral"
  | "monitoring"
  | "conversation";

export interface AiReportRecommendation {
  type: AiReportRecommendationType;
  text: string;
}

export interface AiReportFlaggedItem {
  questionIndex: number;
  reason: string;
}

export interface DiagnosticAiReport {
  sessionId: string;
  status: AiReportStatus;
  model: string | null;
  summary: string | null;
  interpretation: string | null;
  riskFactors: AiReportRiskFactor[] | null;
  recommendations: AiReportRecommendation[] | null;
  trend: string | null;
  flaggedItems: AiReportFlaggedItem[] | null;
  tokensUsed: number | null;
  errorMessage: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionAnswerItem {
  questionIndex: number;
  questionText: string | null;
  answer: number;
  answerLabel: string | null;
  score: number | null;
}

export interface SessionAnswersResponse {
  sessionId: string;
  testSlug: string | null;
  testName: string | null;
  items: SessionAnswerItem[];
}

export interface TestResultStudent {
  severity: Severity;
  friendlyMessage: string;
  recommendation: string;
}

export interface TestResultPsychologist {
  totalScore: number;
  maxScore: number;
  severity: Severity;
  answers: { questionIndex: number; answer: number; score: number }[];
}

export interface Exercise {
  id: string;
  type: string;
  slug: string;
  nameRu: string;
  nameKz: string;
  description: string;
  config: BreathingConfig | GroundingConfig | PMRConfig | CbtExerciseConfig | BodyScanConfig | SafePlaceConfig;
}

export interface BreathingConfig {
  inhale: number;
  hold1?: number;
  hold?: number;
  exhale: number;
  hold2?: number;
  cycles: number;
  shape: "square" | "circle" | "balloon";
}

export interface GroundingStep {
  count: number;
  senseRu: string;
  senseKz: string;
  icon: string;
}

export interface GroundingConfig {
  steps: GroundingStep[];
}

export interface PMRStep {
  muscleGroupRu: string;
  muscleGroupKz: string;
  tensionSec: number;
  holdSec: number;
  releaseSec: number;
}

export interface PMRConfig {
  steps: PMRStep[];
}

export interface CbtExerciseConfig {
  cbtType: CbtType;
}

// ── Body Scan config ───────────────────────────────────────────────
export interface BodyScanStep {
  nameRu: string;
  nameKz: string;
  durationSec: number;
}

export interface BodyScanConfig {
  steps: BodyScanStep[];
}

// ── Safe Place config ──────────────────────────────────────────────
export interface SafePlaceStep {
  promptRu: string;
  promptKz: string;
  icon: string;
  placeholderRu: string;
  placeholderKz: string;
}

export interface SafePlaceConfig {
  steps: SafePlaceStep[];
}

// ── CBT types ──────────────────────────────────────────────────────
export type CbtType = "thought_diary" | "joy_jar" | "body_emotion_map";

export interface ThoughtDiaryData {
  situation: string;
  thought: string;
  emotion: string;
  emotionIntensity?: number; // 1-10
  distortion?: string;
  alternative?: string;
}

export interface JoyJarData {
  text: string;
}

export interface BodyEmotionMapRegion {
  regionId: string;
  emotion: string;
  color: string;
}

export interface BodyEmotionMapData {
  regions: BodyEmotionMapRegion[];
  note?: string;
}

export type CbtData = ThoughtDiaryData | JoyJarData | BodyEmotionMapData;

export interface CbtEntry {
  id: string;
  userId: string;
  type: CbtType;
  data: CbtData;
  createdAt: string;
}

export interface ContentQuote {
  id: number;
  textRu: string;
  textKz: string | null;
  category: "motivation" | "proverb" | "affirmation" | "story";
  author: string | null;
}

export type SOSAction = "breathing" | "hotline" | "chat" | "urgent";

export interface SOSEvent {
  id: string;
  userId: string;
  // SOS Action (issue #11). Null for legacy rows that only have `level`.
  type: SOSAction | null;
  // Legacy 1/2/3 severity. Null for events written under the new schema.
  level: 1 | 2 | 3 | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolvedByName?: string;
  notes: string | null;
  contactedStudent: boolean;
  contactedParent: boolean;
  documented: boolean;
  studentName?: string;
  studentGrade?: number;
  studentClass?: string;
  studentClassLetter?: string;
}

export type CrisisSignalType = "acute_crisis" | "concern";
export type CrisisSignalSeverity = "high" | "medium" | "low";
export type CrisisSignalSource = "sos_urgent" | "ai_friend" | "diagnostics";
export type CrisisFeed = "red" | "yellow";

export interface CrisisSignal {
  id: string;
  studentId: string;
  studentName: string;
  studentGrade: number | null;
  studentClassLetter: string | null;
  type: CrisisSignalType;
  severity: CrisisSignalSeverity;
  source: CrisisSignalSource;
  summary: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  contactedStudent: boolean;
  contactedParent: boolean;
  documented: boolean;
}

export interface CrisisFeedCounts {
  red: number;
  yellow: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  mode: string | null;
  startedAt: string;
  lastMessageAt: string;
  preview?: string;
}

export interface ChatMessage {
  id: number;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface InviteCode {
  id: string;
  code: string;
  psychologistId: string;
  studentRealName: string;
  grade: number | null;
  classLetter: string | null;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface PsychologistNote {
  id: string;
  psychologistId: string;
  studentId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentOverview {
  id: string;
  name: string;
  grade: number | null;
  classLetter: string | null;
  lastMood: number | null;
  lastActive: string | null;
  status: "normal" | "attention" | "crisis";
}

export interface InactiveStudent {
  studentId: string;
  studentName: string;
  grade: number | null;
  classLetter: string | null;
  daysInactive: number | null;
  lastActiveDate: string | null;
}

export interface JournalEntry {
  id: string;
  userId: string;
  prompt: string | null;
  content: string;
  createdAt: string;
}

export interface DailyPrompt {
  ru: string;
  kz: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  freezesAvailable: number;
}

export type PlantStage = 1 | 2 | 3 | 4;

export interface PlantInfo {
  growthPoints: number;
  stage: PlantStage;
  name: string | null;
  lastWateredAt: string | null;
  isSleeping: boolean;
  pointsToNextStage: number;
  nextStageThreshold: number;
  createdAt: string;
}

export interface ProgressStats {
  exercisesCompleted: number;
  testsCompleted: number;
  journalEntries: number;
}

export interface Conversation {
  id: string;
  studentId: string;
  psychologistId: string;
  lastMessageAt: string | null;
  createdAt: string;
  otherUser: {
    id: string;
    name: string;
    avatarId: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

export interface DirectMessage {
  id: number;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

// ── Office Hours (replaces legacy Appointments booking model — issue #7) ──

export interface OfficeHoursInterval {
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface OfficeHoursEntry {
  id: string;
  psychologistId: string;
  date: string; // YYYY-MM-DD
  intervals: OfficeHoursInterval[];
  notes: string | null;
  updatedAt: string;
}

export type OfficeHoursInfoBlock =
  | { kind: "available_now"; until: string; notes: string | null }
  | { kind: "available_later_today"; from: string; until: string; notes: string | null }
  | { kind: "available_tomorrow"; from: string; until: string; notes: string | null }
  | { kind: "unavailable_today"; nextDate: string | null };

export type AchievementCategory = "first_steps" | "streak" | "mastery" | "growth";

export interface Achievement {
  id: string;
  slug: string;
  category: AchievementCategory;
  nameRu: string;
  nameKz: string | null;
  descriptionRu: string | null;
  descriptionKz: string | null;
  emoji: string;
  sortOrder: number;
}

export interface UserAchievementItem {
  achievement: Achievement;
  earned: boolean;
  earnedAt: string | null;
}

export interface AchievementsSummary {
  earnedCount: number;
  totalCount: number;
  recentAchievements: UserAchievementItem[];
}
