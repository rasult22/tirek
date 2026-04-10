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
  mood: number;
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
  config: BreathingConfig | GroundingConfig | PMRConfig | CbtExerciseConfig;
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

// ── CBT types ──────────────────────────────────────────────────────
export type CbtType = "thought_diary";

export interface ThoughtDiaryData {
  situation: string;
  thought: string;
  emotion: string;
  emotionIntensity?: number; // 1-10
  distortion?: string;
  alternative?: string;
}

export type CbtData = ThoughtDiaryData;

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
  category: "motivation" | "proverb" | "affirmation";
  author: string | null;
}

export interface SOSEvent {
  id: string;
  userId: string;
  level: 1 | 2 | 3;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  notes: string | null;
  studentName?: string;
  studentGrade?: number;
  studentClass?: string;
  studentClassLetter?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  mode: "talk" | "problem" | "exam" | "discovery";
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
  grade: number | null;
  classLetter: string | null;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "crisis" | "sos_alert" | "concern_detected" | "reminder" | "assignment" | "system" | "direct_message" | "appointment" | "achievement";
  title: string;
  body: string;
  read: boolean;
  metadata?: Record<string, unknown>;
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

export interface AnalyticsOverview {
  totalStudents: number;
  activeToday: number;
  pendingTests: number;
  crisisAlerts: number;
  averageMood: number | null;
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

export interface FlaggedMessage {
  messageId: number;
  content: string;
  createdAt: string;
  studentName: string;
  studentGrade: number | null;
  studentClass: string | null;
  sessionId: string;
  sosEventId: string | null;
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

export type AppointmentStatus = "scheduled" | "confirmed" | "cancelled" | "completed";

export interface AppointmentSlot {
  id: string;
  psychologistId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isBooked: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  slotId: string;
  studentId: string;
  psychologistId: string;
  status: AppointmentStatus;
  studentNote: string | null;
  psychologistNote: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  date?: string;
  startTime?: string;
  endTime?: string;
  psychologistName?: string;
  studentName?: string;
  studentGrade?: number | null;
  studentClassLetter?: string | null;
}

export interface UpcomingAppointment {
  id: string;
  status: AppointmentStatus;
  date: string;
  startTime: string;
  endTime: string;
  psychologistName: string;
}

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
