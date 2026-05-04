import type {
  Achievement,
  AchievementsSummary,
  AssignedTest,
  AuthResponse,
  CbtEntry,
  CbtType,
  ChatMessage,
  ChatSession,
  ContentQuote,
  Conversation,
  CrisisFeed,
  CrisisFeedCounts,
  CrisisSignal,
  DailyPrompt,
  DiagnosticAiReport,
  DiagnosticSession,
  DiagnosticTest,
  DirectMessage,
  Exercise,
  InactiveStudent,
  InviteCode,
  JournalEntry,
  MoodCalendarDay,
  MoodEntry,
  MoodInsights,
  MoodToday,
  OfficeHoursDayOfWeek,
  OfficeHoursInfoBlock,
  OfficeHoursInterval,
  OfficeHoursOverrideEntry,
  OfficeHoursResolved,
  OfficeHoursTemplateEntry,
  PaginatedResponse,
  PlantInfo,
  ProgressStats,
  SessionAnswersResponse,
  Severity,
  SOSAction,
  SOSEvent,
  StreakInfo,
  StudentOverview,
  TestQuestion,
  TimelineEvent,
  TimelineEventType,
  User,
  UserAchievementItem,
} from "../types/index.js";

// ── Options & errors ────────────────────────────────────────────────

export interface CreateTirekClientOptions {
  baseUrl: string;
  getToken: () => string | null | Promise<string | null>;
  /**
   * Custom fetch — для тестов и платформенной подмены. По умолчанию глобальный fetch.
   */
  fetch?: typeof fetch;
  /**
   * Колбэк, вызываемый когда backend ответил 401. Caller сам решает, что делать
   * (logout, redirect). Shared client про роутинг ничего не знает.
   */
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Local request/response shapes (отсутствуют в shared/types) ──────

export interface StudentsListFilters {
  search?: string;
  grade?: number;
  classLetter?: string;
  status?: string;
}

export type RiskReason =
  | {
      kind: "severe_test_result";
      sessionId: string;
      testSlug: string;
      testName: string;
      completedAt: string;
    }
  | {
      kind: "moderate_test_result";
      sessionId: string;
      testSlug: string;
      testName: string;
      completedAt: string;
    }
  | {
      kind: "flagged_items";
      sessionId: string;
      testSlug: string;
      testName: string;
      completedAt: string;
    };

export interface StudentDetail {
  student: User;
  status: "normal" | "attention" | "crisis";
  reason: RiskReason | null;
  moodHistory: MoodEntry[];
  testResults: (DiagnosticSession & { testSlug?: string; testName?: string })[];
}

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  status: "attention" | "crisis";
  reason: RiskReason | null;
}

export interface SuggestedAction {
  type: "exercise" | "journal" | "chat" | "hotline";
  textKey: string;
  deeplink: string;
}

export interface CompletionResult {
  completed: true;
  sessionId: string;
  requiresSupport: boolean;
  suggestedActions: SuggestedAction[];
}

export interface TestSessionStart {
  sessionId: string;
  testId: string;
  nameRu: string;
  nameKz: string;
  questions: TestQuestion[];
  questionCount: number;
}

export interface SessionResult {
  sessionId: string;
  testId: string;
  testName: string | null;
  completedAt: string | null;
  requiresSupport: boolean;
  suggestedActions: SuggestedAction[];
}

export interface DiagnosticsFilters {
  testSlug?: string;
  severity?: Severity | string;
  grade?: number;
  classLetter?: string;
  from?: string;
  to?: string;
}

export interface DiagnosticResultRow {
  sessionId: string;
  studentId: string;
  testId: string;
  testName: string | null;
  completedAt: string | null;
  totalScore: number | null;
  maxScore: number | null;
  severity: Severity | null;
  studentName?: string;
  studentGrade?: number;
  studentClass?: string;
  testSlug?: string;
}

export interface AssignTestData {
  testSlug: string;
  target: "student" | "class";
  studentId?: string;
  grade?: number;
  classLetter?: string;
  dueDate?: string;
  studentMessage?: string;
}

export type TestAssignmentStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "expired"
  | "cancelled";

export interface TestAssignmentRow {
  id: string;
  testId: string;
  testSlug?: string;
  testName?: string;
  assignedBy: string;
  targetType: "student" | "class";
  targetGrade: number | null;
  targetClassLetter: string | null;
  targetStudentId: string | null;
  studentName?: string | null;
  dueDate: string | null;
  status: TestAssignmentStatus;
  studentMessage: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface AssignmentsListFilters {
  status?: TestAssignmentStatus;
  studentId?: string;
}

export interface CrisisResolveData {
  notes?: string;
  contactedStudent?: boolean;
  contactedParent?: boolean;
  documented?: boolean;
}

export interface GenerateInviteCodesData {
  studentNames: string[];
  grade?: number;
  classLetter?: string;
}

// ── Internal request runner ─────────────────────────────────────────

interface ClientInternals {
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
  rawFetch: (path: string, init?: RequestInit) => Promise<Response>;
  baseUrl: string;
  getToken: () => string | null | Promise<string | null>;
}

function makeInternals(opts: CreateTirekClientOptions): ClientInternals {
  const fetchImpl = opts.fetch ?? fetch;

  async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await opts.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return fetchImpl(`${opts.baseUrl}${path}`, { ...init, headers });
  }

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await rawFetch(path, init);

    if (res.status === 401) {
      opts.onUnauthorized?.();
      throw new ApiError(401, "UNAUTHORIZED", "Session expired");
    }

    if (!res.ok) {
      const body = await res
        .json()
        .catch(() => ({ error: "Unknown error", code: "UNKNOWN" }));
      throw new ApiError(
        res.status,
        body.code ?? "UNKNOWN",
        body.error ?? "Unknown error",
      );
    }

    return (await res.json()) as T;
  }

  return { request, rawFetch, baseUrl: opts.baseUrl, getToken: opts.getToken };
}

// ── Public client interface ─────────────────────────────────────────

export interface TirekClient {
  auth: {
    login(input: { email: string; password: string }): Promise<AuthResponse>;
    register(input: {
      email: string;
      password: string;
      inviteCode: string;
      avatarId?: string;
    }): Promise<AuthResponse>;
    registerPsychologist(input: {
      email: string;
      password: string;
      name: string;
      schoolId?: string;
    }): Promise<AuthResponse>;
    me(): Promise<User>;
    updateProfile(input: Record<string, unknown>): Promise<User>;
    forgotPassword(input: { email: string }): Promise<{ success: true }>;
    verifyResetCode(input: {
      email: string;
      code: string;
    }): Promise<{ valid: true }>;
    resetPassword(input: {
      email: string;
      code: string;
      newPassword: string;
    }): Promise<AuthResponse>;
  };

  // ── Student-side ──────────────────────────────────────────────────
  mood: {
    create(input: {
      mood: number;
      energy?: number | null;
      sleepQuality?: number | null;
      stressLevel?: number | null;
      note?: string | null;
      factors?: string[] | null;
    }): Promise<MoodEntry>;
    today(): Promise<MoodToday>;
    calendar(year: number, month: number): Promise<MoodCalendarDay[]>;
    insights(): Promise<MoodInsights>;
  };
  achievements: {
    getAll(): Promise<{
      achievements: UserAchievementItem[];
      earnedCount: number;
      totalCount: number;
    }>;
    getSummary(): Promise<AchievementsSummary>;
  };
  cbt: {
    list(type?: CbtType): Promise<PaginatedResponse<CbtEntry>>;
    create(input: { type: CbtType; data: Record<string, unknown> }): Promise<CbtEntry>;
    update(id: string, data: Record<string, unknown>): Promise<CbtEntry>;
    delete(id: string): Promise<{ ok: boolean }>;
  };
  chat: {
    sessions(): Promise<PaginatedResponse<ChatSession>>;
    create(): Promise<ChatSession>;
    messages(sessionId: string): Promise<PaginatedResponse<ChatMessage>>;
    send(sessionId: string, content: string): Promise<ChatMessage>;
    /**
     * SSE streaming. Возвращает raw Response (не парсит JSON).
     * 401 в этом случае не вызывает onUnauthorized — caller обрабатывает сам.
     */
    streamMessage(sessionId: string, content: string): Promise<Response>;
  };
  content: {
    quoteOfTheDay(): Promise<ContentQuote>;
    quotes(category?: string): Promise<PaginatedResponse<ContentQuote>>;
  };
  directChat: {
    conversations(): Promise<PaginatedResponse<Conversation>>;
    createConversation(psychologistId: string): Promise<Conversation>;
    messages(conversationId: string): Promise<PaginatedResponse<DirectMessage>>;
    send(conversationId: string, content: string): Promise<DirectMessage>;
    markRead(conversationId: string): Promise<{ ok: boolean }>;
    unreadCount(): Promise<{ count: number }>;
    myPsychologist(): Promise<{ id: string; name: string; avatarId: string | null }>;
  };
  exercises: {
    list(): Promise<Exercise[]>;
    history(): Promise<PaginatedResponse<unknown>>;
    stats(): Promise<ProgressStats>;
    logCompletion(exerciseId: string): Promise<{ ok: boolean }>;
  };
  journal: {
    list(): Promise<PaginatedResponse<JournalEntry>>;
    create(input: { prompt?: string; content: string }): Promise<JournalEntry>;
    delete(id: string): Promise<{ ok: boolean }>;
    dailyPrompt(): Promise<DailyPrompt>;
  };
  plant: {
    get(): Promise<PlantInfo>;
    rename(name: string): Promise<{ ok: boolean }>;
  };
  sos: {
    trigger(action: SOSAction): Promise<SOSEvent>;
  };
  streaks: {
    get(): Promise<StreakInfo>;
  };
  pushToken: {
    register(input: { token: string; platform: string }): Promise<{ ok: boolean }>;
  };
  tests: {
    list(): Promise<DiagnosticTest[]>;
    assigned(): Promise<AssignedTest[]>;
    start(testId: string): Promise<TestSessionStart>;
    answer(
      sessionId: string,
      input: { questionIndex: number; answer: number },
    ): Promise<{ ok: boolean }>;
    complete(sessionId: string): Promise<CompletionResult>;
    session(sessionId: string): Promise<SessionResult>;
    history(): Promise<PaginatedResponse<SessionResult>>;
  };

  // ── Shared (student + psychologist) ───────────────────────────────
  officeHoursStudent: {
    infoBlock(): Promise<OfficeHoursInfoBlock>;
  };
  officeHoursPublic: {
    resolve(psychologistId: string, date: string): Promise<OfficeHoursResolved>;
  };
  // ── Psychologist-side ─────────────────────────────────────────────
  psychologist: {
    students: {
      list(filters?: StudentsListFilters): Promise<PaginatedResponse<StudentOverview>>;
      get(id: string): Promise<StudentDetail>;
      detach(id: string): Promise<{ success: boolean }>;
      atRisk(): Promise<{ data: AtRiskStudent[] }>;
    };
    achievements: {
      getStudentAchievements(studentId: string): Promise<{
        achievements: UserAchievementItem[];
        earnedCount: number;
        totalCount: number;
      }>;
    };
    cbt: {
      getStudentEntries(studentId: string, type?: string): Promise<PaginatedResponse<CbtEntry>>;
    };
    timeline: {
      getStudentTimeline(
        studentId: string,
        opts?: { type?: TimelineEventType; limit?: number; offset?: number },
      ): Promise<PaginatedResponse<TimelineEvent>>;
    };
    crisis: {
      getFeed(feed: CrisisFeed): Promise<{ data: CrisisSignal[] }>;
      getCounts(): Promise<CrisisFeedCounts>;
      resolve(id: string, data: CrisisResolveData): Promise<CrisisSignal>;
      getHistory(): Promise<PaginatedResponse<CrisisSignal>>;
    };
    diagnostics: {
      getResults(filters?: DiagnosticsFilters): Promise<PaginatedResponse<DiagnosticResultRow>>;
      assignTest(data: AssignTestData): Promise<{ success: boolean }>;
      listAssignments(filters?: AssignmentsListFilters): Promise<TestAssignmentRow[]>;
      cancelAssignment(assignmentId: string): Promise<TestAssignmentRow>;
      getReport(sessionId: string): Promise<DiagnosticAiReport | { status: "pending" }>;
      regenerateReport(sessionId: string): Promise<{ status: "pending" }>;
      getSessionAnswers(sessionId: string): Promise<SessionAnswersResponse>;
    };
    directChat: {
      conversations(): Promise<PaginatedResponse<Conversation>>;
      createConversation(studentId: string): Promise<Conversation>;
      messages(conversationId: string): Promise<PaginatedResponse<DirectMessage>>;
      send(conversationId: string, content: string): Promise<DirectMessage>;
      markRead(conversationId: string): Promise<{ ok: boolean }>;
      unreadCount(): Promise<{ count: number }>;
    };
    /**
     * Export endpoints возвращают CSV. Чтобы оставить shared client изолированным
     * от платформенных средств скачивания (browser blob vs Expo file system),
     * метод exportUrl собирает абсолютный URL — caller сам делает fetch/Linking/Sharing.
     */
    export: {
      classCsvUrl(filters: { grade?: number; classLetter?: string }): string;
    };
    inactivity: {
      list(threshold?: number): Promise<{ data: InactiveStudent[] }>;
    };
    inviteCodes: {
      list(): Promise<PaginatedResponse<InviteCode>>;
      generate(data: GenerateInviteCodesData): Promise<InviteCode[]>;
      revoke(id: string): Promise<{ success: boolean }>;
    };
    officeHours: {
      getTemplate(): Promise<OfficeHoursTemplateEntry[]>;
      upsertTemplateDay(
        dayOfWeek: OfficeHoursDayOfWeek,
        intervals: OfficeHoursInterval[],
        notes: string | null,
      ): Promise<OfficeHoursTemplateEntry>;
      getOverrides(from: string, to: string): Promise<OfficeHoursOverrideEntry[]>;
      upsertOverrideDay(
        date: string,
        intervals: OfficeHoursInterval[],
        notes: string | null,
      ): Promise<OfficeHoursOverrideEntry>;
      deleteOverrideDay(date: string): Promise<{ success: boolean }>;
    };
    schools: {
      get(id: string): Promise<{ id: string; name: string; city: string | null }>;
      create(input: {
        name: string;
        city?: string | null;
      }): Promise<{ id: string; name: string; city: string | null }>;
    };
    pushToken: {
      register(input: { token: string; platform: string }): Promise<{ ok: boolean }>;
    };
  };
}

// ── Implementation ──────────────────────────────────────────────────

export function createTirekClient(opts: CreateTirekClientOptions): TirekClient {
  const internals = makeInternals(opts);
  const { request, rawFetch, baseUrl } = internals;

  return {
    auth: {
      login: (data) =>
        request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
      register: (data) =>
        request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
      registerPsychologist: (data) =>
        request("/auth/register-psychologist", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      me: () => request("/auth/me"),
      updateProfile: (data) =>
        request("/auth/profile", { method: "PATCH", body: JSON.stringify(data) }),
      forgotPassword: (data) =>
        request("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      verifyResetCode: (data) =>
        request("/auth/verify-reset-code", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      resetPassword: (data) =>
        request("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },

    mood: {
      create: (data) =>
        request("/student/mood", { method: "POST", body: JSON.stringify(data) }),
      today: () => request("/student/mood/today"),
      calendar: (year, month) =>
        request(`/student/mood/calendar?year=${year}&month=${month}`),
      insights: () => request("/student/mood/insights"),
    },

    achievements: {
      getAll: () => request("/student/achievements"),
      getSummary: () => request("/student/achievements/summary"),
    },

    cbt: {
      list: (type) => request(`/student/cbt${type ? `?type=${type}` : ""}`),
      create: (data) =>
        request("/student/cbt", { method: "POST", body: JSON.stringify(data) }),
      update: (id, data) =>
        request(`/student/cbt/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id) => request(`/student/cbt/${id}`, { method: "DELETE" }),
    },

    chat: {
      sessions: () => request("/student/chat/sessions?limit=6"),
      create: () =>
        request("/student/chat/sessions", {
          method: "POST",
          body: JSON.stringify({}),
        }),
      messages: (sessionId) =>
        request(`/student/chat/sessions/${sessionId}/messages?limit=100`),
      send: (sessionId, content) =>
        request(`/student/chat/sessions/${sessionId}/message`, {
          method: "POST",
          body: JSON.stringify({ content }),
        }),
      streamMessage: (sessionId, content) =>
        rawFetch(`/student/chat/sessions/${sessionId}/stream`, {
          method: "POST",
          body: JSON.stringify({ content }),
        }),
    },

    content: {
      quoteOfTheDay: () => request("/student/quote-of-the-day"),
      quotes: (category) =>
        request(
          `/student/quotes${category ? `?category=${category}&limit=50` : "?limit=50"}`,
        ),
    },

    directChat: {
      conversations: () => request("/student/direct-chat/conversations"),
      createConversation: (psychologistId) =>
        request("/student/direct-chat/conversations", {
          method: "POST",
          body: JSON.stringify({ psychologistId }),
        }),
      messages: (conversationId) =>
        request(
          `/student/direct-chat/conversations/${conversationId}/messages?limit=100`,
        ),
      send: (conversationId, content) =>
        request(`/student/direct-chat/conversations/${conversationId}/messages`, {
          method: "POST",
          body: JSON.stringify({ content }),
        }),
      markRead: (conversationId) =>
        request(`/student/direct-chat/conversations/${conversationId}/read`, {
          method: "PATCH",
        }),
      unreadCount: () => request("/student/direct-chat/unread-count"),
      myPsychologist: () => request("/student/direct-chat/my-psychologist"),
    },

    exercises: {
      list: () => request("/student/exercises"),
      history: () => request("/student/exercises/history"),
      stats: () => request("/student/exercises/stats"),
      logCompletion: (exerciseId) =>
        request(`/student/exercises/${exerciseId}/complete`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
    },

    journal: {
      list: () => request("/student/journal"),
      create: (data) =>
        request("/student/journal", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      delete: (id) => request(`/student/journal/${id}`, { method: "DELETE" }),
      dailyPrompt: () => request("/student/journal/prompt"),
    },

    plant: {
      get: () => request("/student/plant"),
      rename: (name) =>
        request("/student/plant/name", {
          method: "PATCH",
          body: JSON.stringify({ name }),
        }),
    },

    sos: {
      trigger: (action) =>
        request("/student/sos", {
          method: "POST",
          body: JSON.stringify({ action }),
        }),
    },

    streaks: {
      get: () => request("/student/streaks"),
    },

    pushToken: {
      register: (data) =>
        request("/student/push-token", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },

    tests: {
      list: () => request("/student/tests/"),
      assigned: () => request("/student/tests/assigned"),
      start: (testId) =>
        request(`/student/tests/${testId}/start`, { method: "POST" }),
      answer: (sessionId, data) =>
        request(`/student/tests/sessions/${sessionId}/answer`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      complete: (sessionId) =>
        request(`/student/tests/sessions/${sessionId}/complete`, { method: "POST" }),
      session: (sessionId) => request(`/student/tests/sessions/${sessionId}`),
      history: () => request("/student/tests/history"),
    },

    officeHoursStudent: {
      infoBlock: () => request("/office-hours/student/info-block"),
    },

    officeHoursPublic: {
      resolve: (psychologistId, date) =>
        request(
          `/office-hours/resolve?psychologistId=${encodeURIComponent(psychologistId)}&date=${encodeURIComponent(date)}`,
        ),
    },

    psychologist: {
      students: {
        list: (filters) => {
          const sp = new URLSearchParams();
          if (filters?.search) sp.set("search", filters.search);
          if (filters?.grade) sp.set("grade", String(filters.grade));
          if (filters?.classLetter) sp.set("classLetter", filters.classLetter);
          if (filters?.status) sp.set("status", filters.status);
          sp.set("limit", "100");
          const s = sp.toString();
          return request(`/psychologist/students${s ? `?${s}` : ""}`);
        },
        get: (id) => request(`/psychologist/students/${id}`),
        detach: (id) =>
          request(`/psychologist/students/${id}`, { method: "DELETE" }),
        atRisk: () => request(`/psychologist/students/at-risk`),
      },

      achievements: {
        getStudentAchievements: (studentId) =>
          request(`/psychologist/achievements/${studentId}`),
      },

      cbt: {
        getStudentEntries: (studentId, type) =>
          request(
            `/psychologist/cbt/${studentId}${type ? `?type=${type}` : ""}`,
          ),
      },

      timeline: {
        getStudentTimeline: (studentId, opts) => {
          const sp = new URLSearchParams();
          if (opts?.type) sp.set("type", opts.type);
          if (opts?.limit !== undefined) sp.set("limit", String(opts.limit));
          if (opts?.offset !== undefined) sp.set("offset", String(opts.offset));
          const qs = sp.toString();
          return request(
            `/psychologist/students/${studentId}/timeline${qs ? `?${qs}` : ""}`,
          );
        },
      },

      crisis: {
        getFeed: (feed) =>
          request(`/psychologist/crisis-signals?feed=${feed}`),
        getCounts: () => request("/psychologist/crisis-signals/counts"),
        resolve: (id, data) =>
          request(`/psychologist/crisis-signals/${id}/resolve`, {
            method: "PATCH",
            body: JSON.stringify(data),
          }),
        getHistory: () => request("/psychologist/crisis-signals/history"),
      },

      diagnostics: {
        getResults: (filters) => {
          const sp = new URLSearchParams();
          sp.set("limit", "100");
          if (filters?.testSlug) sp.set("testSlug", filters.testSlug);
          if (filters?.severity) sp.set("severity", String(filters.severity));
          if (filters?.grade) sp.set("grade", String(filters.grade));
          if (filters?.classLetter) sp.set("classLetter", filters.classLetter);
          if (filters?.from) sp.set("from", filters.from);
          if (filters?.to) sp.set("to", filters.to);
          return request(`/psychologist/diagnostics/results?${sp.toString()}`);
        },
        assignTest: (data) =>
          request("/psychologist/diagnostics/assign", {
            method: "POST",
            body: JSON.stringify(data),
          }),
        listAssignments: (filters) => {
          const sp = new URLSearchParams();
          if (filters?.status) sp.set("status", filters.status);
          if (filters?.studentId) sp.set("studentId", filters.studentId);
          const qs = sp.toString();
          return request(
            `/psychologist/diagnostics/assignments${qs ? `?${qs}` : ""}`,
          );
        },
        cancelAssignment: (assignmentId) =>
          request(
            `/psychologist/diagnostics/assignments/${assignmentId}/cancel`,
            { method: "POST" },
          ),
        getReport: (sessionId) =>
          request(`/psychologist/diagnostics/sessions/${sessionId}/report`),
        regenerateReport: (sessionId) =>
          request(
            `/psychologist/diagnostics/sessions/${sessionId}/report/regenerate`,
            { method: "POST" },
          ),
        getSessionAnswers: (sessionId) =>
          request(`/psychologist/diagnostics/sessions/${sessionId}/answers`),
      },

      directChat: {
        conversations: () => request("/psychologist/direct-chat/conversations"),
        createConversation: (studentId) =>
          request("/psychologist/direct-chat/conversations", {
            method: "POST",
            body: JSON.stringify({ studentId }),
          }),
        messages: (conversationId) =>
          request(
            `/psychologist/direct-chat/conversations/${conversationId}/messages?limit=100`,
          ),
        send: (conversationId, content) =>
          request(
            `/psychologist/direct-chat/conversations/${conversationId}/messages`,
            { method: "POST", body: JSON.stringify({ content }) },
          ),
        markRead: (conversationId) =>
          request(
            `/psychologist/direct-chat/conversations/${conversationId}/read`,
            { method: "PATCH" },
          ),
        unreadCount: () => request("/psychologist/direct-chat/unread-count"),
      },

      export: {
        classCsvUrl: (filters) => {
          const sp = new URLSearchParams();
          if (filters.grade) sp.set("grade", String(filters.grade));
          if (filters.classLetter) sp.set("classLetter", filters.classLetter);
          const s = sp.toString();
          return `${baseUrl}/psychologist/export/class/csv${s ? `?${s}` : ""}`;
        },
      },

      inactivity: {
        list: (threshold) => {
          const qs = threshold !== undefined ? `?threshold=${threshold}` : "";
          return request(`/psychologist/inactive-students${qs}`);
        },
      },

      inviteCodes: {
        list: () => request("/psychologist/invite-codes?limit=100"),
        generate: (data) =>
          request("/psychologist/invite-codes", {
            method: "POST",
            body: JSON.stringify(data),
          }),
        revoke: (id) =>
          request(`/psychologist/invite-codes/${id}`, { method: "DELETE" }),
      },

      officeHours: {
        getTemplate: () => request("/psychologist/office-hours/template"),
        upsertTemplateDay: (dayOfWeek, intervals, notes) =>
          request(`/psychologist/office-hours/template/${dayOfWeek}`, {
            method: "PUT",
            body: JSON.stringify({ intervals, notes }),
          }),
        getOverrides: (from, to) =>
          request(
            `/psychologist/office-hours/override?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          ),
        upsertOverrideDay: (date, intervals, notes) =>
          request(`/psychologist/office-hours/override/${encodeURIComponent(date)}`, {
            method: "PUT",
            body: JSON.stringify({ intervals, notes }),
          }),
        deleteOverrideDay: (date) =>
          request(`/psychologist/office-hours/override/${encodeURIComponent(date)}`, {
            method: "DELETE",
          }),
      },
      schools: {
        get: (id) => request(`/psychologist/schools/${id}`),
        create: (data) =>
          request("/psychologist/schools", {
            method: "POST",
            body: JSON.stringify(data),
          }),
      },
      pushToken: {
        register: (data) =>
          request("/psychologist/push-token", {
            method: "POST",
            body: JSON.stringify(data),
          }),
      },
    },
  };
}
