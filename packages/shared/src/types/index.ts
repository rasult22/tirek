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
  config: BreathingConfig;
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
}

export interface ChatSession {
  id: string;
  userId: string;
  mode: "talk" | "problem" | "exam" | "discovery";
  startedAt: string;
  lastMessageAt: string;
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
  type: "crisis" | "reminder" | "assignment" | "system";
  title: string;
  body: string;
  read: boolean;
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
