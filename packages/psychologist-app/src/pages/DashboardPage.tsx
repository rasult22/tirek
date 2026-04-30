import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { clsx } from "clsx";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  Loader2,
  MessageSquare,
  UserMinus,
} from "lucide-react";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { getFeed, getHistory } from "../api/crisis.js";
import { getAtRiskStudents } from "../api/students.js";
import { inactivityApi } from "../api/inactivity.js";
import { listAssignments } from "../api/diagnostics.js";
import { directChatApi } from "../api/direct-chat.js";
import { formatRiskReason } from "@tirek/shared";
import type {
  CrisisSignal,
  Conversation,
  InactiveStudent,
} from "@tirek/shared";

type HeroItem = {
  key: string;
  studentId: string;
  studentName: string;
  summary?: string;
  timestamp?: string;
};

type HeroMode = "loading" | "red" | "yellow" | "calm";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "<1м";
  if (minutes < 60) return `${minutes}м`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}ч`;
  return `${Math.floor(hours / 24)}д`;
}

function startOfWeekIso(now: Date = new Date()): string {
  const d = new Date(now);
  const dow = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (dow - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfTodayIso(now: Date = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function DashboardPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { data: redData, isLoading: redLoading } = useQuery({
    queryKey: ["crisis", "feed", "red"],
    queryFn: () => getFeed("red"),
    refetchInterval: 30_000,
  });
  const redSignals = redData?.data ?? [];

  const { data: yellowData, isLoading: yellowLoading } = useQuery({
    queryKey: ["crisis", "feed", "yellow"],
    queryFn: () => getFeed("yellow"),
    refetchInterval: 60_000,
  });

  const { data: atRiskData, isLoading: atRiskLoading } = useQuery({
    queryKey: ["students", "at-risk"],
    queryFn: () => getAtRiskStudents(),
    refetchInterval: 60_000,
  });

  const { data: inactiveData, isLoading: inactiveLoading } = useQuery({
    queryKey: ["inactivity", "list"],
    queryFn: () => inactivityApi.list(),
    refetchInterval: 60_000,
  });
  const inactiveStudentsAll = inactiveData?.data ?? [];

  const { data: assignmentsData } = useQuery({
    queryKey: ["assignments", "list"],
    queryFn: () => listAssignments(),
    refetchInterval: 120_000,
  });
  const allAssignments = assignmentsData ?? [];

  const { data: conversationsData } = useQuery({
    queryKey: ["direct-chat", "conversations"],
    queryFn: directChatApi.conversations,
    refetchInterval: 30_000,
  });
  const conversations = conversationsData?.data ?? [];

  const { data: historyData } = useQuery({
    queryKey: ["crisis", "history"],
    queryFn: getHistory,
    refetchInterval: 120_000,
  });
  const history = historyData?.data ?? [];

  const redStudentIds = new Set(redSignals.map((s) => s.studentId));
  const yellowSignals = (yellowData?.data ?? []).filter(
    (s) => !redStudentIds.has(s.studentId),
  );
  const yellowStudentIds = new Set(yellowSignals.map((s) => s.studentId));
  const atRiskStudents = (atRiskData?.data ?? []).filter(
    (s) =>
      !redStudentIds.has(s.studentId) && !yellowStudentIds.has(s.studentId),
  );
  const attentionStudentIds = new Set([
    ...yellowStudentIds,
    ...atRiskStudents.map((s) => s.studentId),
  ]);
  const inactiveStudents: InactiveStudent[] = inactiveStudentsAll.filter(
    (s) =>
      !redStudentIds.has(s.studentId) && !attentionStudentIds.has(s.studentId),
  );

  const yellowAttentionLoading = yellowLoading || atRiskLoading;
  const totalAttentionCount = yellowSignals.length + atRiskStudents.length;
  const heroLoading =
    redLoading || (redSignals.length === 0 && yellowAttentionLoading);

  const heroMode: HeroMode = heroLoading
    ? "loading"
    : redSignals.length > 0
      ? "red"
      : totalAttentionCount > 0
        ? "yellow"
        : "calm";

  const yellowHeroItems: HeroItem[] = [
    ...yellowSignals.map((s) => ({
      key: `y-${s.id}`,
      studentId: s.studentId,
      studentName: s.studentName,
      summary: s.summary,
      timestamp: s.createdAt,
    })),
    ...atRiskStudents.map((s) => {
      const reasonText = formatRiskReason({
        reason: s.reason,
        t,
        language,
      });
      return {
        key: `risk-${s.studentId}`,
        studentId: s.studentId,
        studentName: s.studentName,
        summary: reasonText ?? undefined,
      } as HeroItem;
    }),
  ];

  const redHeroItems: HeroItem[] = redSignals.map((s) => ({
    key: s.id,
    studentId: s.studentId,
    studentName: s.studentName,
    summary: s.summary,
    timestamp: s.createdAt,
  }));

  const weekStart = startOfWeekIso();
  const weeklyAssignments = allAssignments.filter(
    (a) => a.createdAt && a.createdAt >= weekStart,
  );
  const pendingThisWeek = weeklyAssignments.filter(
    (a) => a.status === "pending" || a.status === "in_progress",
  );

  const todayStart = startOfTodayIso();
  const todaysConversations: Conversation[] = conversations.filter((c) => {
    const ts = c.lastMessage?.createdAt;
    return typeof ts === "string" && ts >= todayStart;
  });
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const recentHistory = history.slice(0, 5);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-xl xl:text-2xl font-bold tracking-tight text-text-main">
          {t.psychologist.dashboard}
        </h1>
      </div>

      {/* Top region: priority block + side panel */}
      <div className="grid grid-cols-12 gap-4 xl:gap-5">
        <div className="col-span-12 xl:col-span-7">
          {heroMode === "loading" && <PriorityLoading />}
          {heroMode === "red" && (
            <PriorityBlock
              tone="danger"
              title={t.psychologist.dashboardRedHeroTitle}
              count={redSignals.length}
              items={redHeroItems}
              ctaLabel={t.psychologist.dashboardOpenCrisisFeedCta}
              onCtaClick={() => navigate("/crisis")}
              onItemClick={() => navigate("/crisis")}
            />
          )}
          {heroMode === "yellow" && (
            <PriorityBlock
              tone="warning"
              title={t.psychologist.dashboardYellowHeroTitle}
              count={totalAttentionCount}
              items={yellowHeroItems}
              ctaLabel={t.psychologist.dashboardOpenAttentionCta}
              onCtaClick={() => navigate("/students")}
              onItemClick={(item) => navigate(`/students/${item.studentId}`)}
            />
          )}
          {heroMode === "calm" && <PriorityCalm />}
        </div>

        <div className="col-span-12 xl:col-span-5">
          <SidePanelInactive
            loading={inactiveLoading}
            students={inactiveStudents}
            onStudentClick={(id) => navigate(`/students/${id}`)}
            onSeeAllClick={() => navigate("/students")}
          />
        </div>
      </div>

      {/* Secondary grid: 3 dense widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-5">
        <SecondaryAssignments
          weeklyTotal={weeklyAssignments.length}
          pending={pendingThisWeek.length}
          onClick={() => navigate("/diagnostics")}
        />
        <SecondaryMessages
          todayCount={todaysConversations.length}
          unreadCount={totalUnread}
          onClick={() => navigate("/messages")}
        />
        <SecondaryRecentActivity
          loading={!historyData}
          items={recentHistory}
          onItemClick={() => navigate("/crisis")}
        />
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /* Priority block — stateful: red → yellow → calm                   */
  /* ---------------------------------------------------------------- */

  function PriorityLoading() {
    return (
      <div className="rounded-2xl border border-border-light bg-surface p-5 xl:p-6 min-h-[280px] flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-text-light" />
      </div>
    );
  }

  function PriorityCalm() {
    return (
      <div className="rounded-2xl border border-border-light bg-gradient-to-br from-brand-soft to-surface p-6 xl:p-8 min-h-[280px] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
          <Activity size={26} className="text-success" />
        </div>
        <h2 className="text-base xl:text-lg font-bold text-text-main">
          {t.psychologist.dashboardAllCalmTitle}
        </h2>
        <p className="text-sm text-text-light mt-1.5 max-w-sm">
          {t.psychologist.dashboardAllCalmHint}
        </p>
      </div>
    );
  }

  function PriorityBlock({
    tone,
    title,
    count,
    items,
    ctaLabel,
    onCtaClick,
    onItemClick,
  }: {
    tone: "danger" | "warning";
    title: string;
    count: number;
    items: HeroItem[];
    ctaLabel: string;
    onCtaClick: () => void;
    onItemClick: (item: HeroItem) => void;
  }) {
    const accentText = tone === "danger" ? "text-danger" : "text-warning";
    const accentBg = tone === "danger" ? "bg-danger" : "bg-warning";
    const accentBgSoft = tone === "danger" ? "bg-danger/8" : "bg-warning/8";
    const accentBgFaint = tone === "danger" ? "bg-danger/4" : "bg-warning/4";
    const accentBorder =
      tone === "danger" ? "border-danger/15" : "border-warning/15";
    const accentRowBorder =
      tone === "danger" ? "border-danger/12" : "border-warning/12";
    const HeroIcon = tone === "danger" ? AlertTriangle : Eye;

    const visible = items.slice(0, 6);

    return (
      <div
        className={clsx(
          "rounded-2xl overflow-hidden border bg-surface",
          accentBorder,
        )}
      >
        <div className="flex items-center justify-between gap-3 p-4 xl:p-5 border-b border-border-light">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                accentBgSoft,
              )}
            >
              <HeroIcon size={18} className={accentText} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm xl:text-base font-bold text-text-main truncate">
                {title}
              </h2>
              <p className="text-[11px] text-text-light mt-0.5">
                {t.psychologist.activeAlerts}
              </p>
            </div>
            <span
              className={clsx(
                "ml-1 px-2 py-0.5 text-[11px] font-bold rounded-full text-white shrink-0",
                accentBg,
              )}
            >
              {count}
            </span>
          </div>
          <button
            type="button"
            onClick={onCtaClick}
            className={clsx(
              "btn-press hidden md:inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors text-white shrink-0",
              accentBg,
            )}
          >
            {ctaLabel}
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="p-3 xl:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {visible.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onItemClick(item)}
                className={clsx(
                  "btn-press group flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all hover:shadow-sm",
                  accentBgFaint,
                  accentRowBorder,
                )}
              >
                <div
                  className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    accentBgSoft,
                  )}
                >
                  <HeroIcon size={15} className={accentText} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-main truncate">
                    {item.studentName}
                  </p>
                  {item.summary ? (
                    <p className="text-xs text-text-light mt-0.5 line-clamp-2">
                      {item.summary}
                    </p>
                  ) : null}
                </div>
                {item.timestamp ? (
                  <div className="flex items-center gap-1 text-[11px] text-text-light font-medium shrink-0">
                    <Clock size={11} />
                    {formatTimeAgo(item.timestamp)}
                  </div>
                ) : null}
              </button>
            ))}
          </div>

          {/* Mobile-visible CTA (md hides because header has it) */}
          <button
            type="button"
            onClick={onCtaClick}
            className={clsx(
              "btn-press mt-3 md:hidden w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors text-white",
              accentBg,
            )}
          >
            {ctaLabel}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Side panel — inactive students                                    */
  /* ---------------------------------------------------------------- */

  function SidePanelInactive({
    loading,
    students,
    onStudentClick,
    onSeeAllClick,
  }: {
    loading: boolean;
    students: InactiveStudent[];
    onStudentClick: (id: string) => void;
    onSeeAllClick: () => void;
  }) {
    const visible = students.slice(0, 6);
    const hasMore = students.length > visible.length;

    return (
      <div className="rounded-2xl border border-border-light bg-surface overflow-hidden h-full flex flex-col">
        <div className="flex items-center justify-between gap-2 p-4 xl:p-5 border-b border-border-light">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-secondary">
              <UserMinus size={17} className="text-text-light" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm xl:text-base font-bold text-text-main truncate">
                {t.psychologist.dashboardInactiveSectionLabel}
              </h2>
              {students.length > 0 ? (
                <p className="text-[11px] text-text-light mt-0.5">
                  {students.length}
                </p>
              ) : null}
            </div>
          </div>
          {hasMore ? (
            <button
              type="button"
              onClick={onSeeAllClick}
              className="btn-press text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 transition-colors shrink-0"
            >
              {t.psychologist.studentDetail.seeAll}
              <ArrowRight size={12} />
            </button>
          ) : null}
        </div>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-text-light" />
            </div>
          ) : visible.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-text-light">
                {t.psychologist.inactiveStudentsEmpty}
              </p>
            </div>
          ) : (
            <ul>
              {visible.map((s, idx) => {
                const initial = s.studentName.charAt(0).toUpperCase();
                const classLabel =
                  s.grade != null
                    ? `${s.grade}${s.classLetter ?? ""}`
                    : null;
                return (
                  <li key={s.studentId}>
                    <button
                      type="button"
                      onClick={() => onStudentClick(s.studentId)}
                      className={clsx(
                        "btn-press w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover",
                        idx > 0 && "border-t border-border-light",
                      )}
                    >
                      <div className="w-9 h-9 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-bold text-text-light shrink-0">
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm font-semibold text-text-main truncate">
                            {s.studentName}
                          </p>
                          {classLabel ? (
                            <span className="text-[11px] text-text-light shrink-0">
                              {classLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className="text-[11px] text-text-light font-medium shrink-0">
                        {s.daysInactive != null
                          ? `${s.daysInactive} ${t.psychologist.inactiveDaysSuffix}`
                          : t.psychologist.inactiveNeverActive}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Secondary widgets                                                  */
  /* ---------------------------------------------------------------- */

  function SecondaryAssignments({
    weeklyTotal,
    pending,
    onClick,
  }: {
    weeklyTotal: number;
    pending: number;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="btn-press group rounded-2xl border border-border-light bg-surface p-4 xl:p-5 text-left transition-all hover:shadow-sm hover:border-primary/30"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList size={17} className="text-primary" />
            </div>
            <h3 className="text-sm font-bold text-text-main">
              {t.psychologist.dashboardWeeklyAssignmentsTitle}
            </h3>
          </div>
          <ArrowRight
            size={14}
            className="text-text-light group-hover:text-primary transition-colors shrink-0"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl xl:text-3xl font-bold text-text-main">
            {weeklyTotal}
          </span>
          <span className="text-xs text-text-light">
            {t.psychologist.dashboardWeeklyAssignmentsTotalSuffix}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-light">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            {pending}{" "}
            {t.psychologist.dashboardWeeklyAssignmentsPendingSuffix}
          </span>
        </div>
      </button>
    );
  }

  function SecondaryMessages({
    todayCount,
    unreadCount,
    onClick,
  }: {
    todayCount: number;
    unreadCount: number;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="btn-press group rounded-2xl border border-border-light bg-surface p-4 xl:p-5 text-left transition-all hover:shadow-sm hover:border-primary/30"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info/15">
              <MessageSquare size={17} className="text-info" />
            </div>
            <h3 className="text-sm font-bold text-text-main">
              {t.psychologist.dashboardTodayMessagesTitle}
            </h3>
          </div>
          <ArrowRight
            size={14}
            className="text-text-light group-hover:text-primary transition-colors shrink-0"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl xl:text-3xl font-bold text-text-main">
            {todayCount}
          </span>
          <span className="text-xs text-text-light">
            {t.psychologist.dashboardTodayMessagesUnitSuffix}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-light">
          {unreadCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-danger" />
              {unreadCount}{" "}
              {t.psychologist.dashboardTodayMessagesUnreadSuffix}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {t.psychologist.dashboardTodayMessagesAllRead}
            </span>
          )}
        </div>
      </button>
    );
  }

  function SecondaryRecentActivity({
    loading,
    items,
    onItemClick,
  }: {
    loading: boolean;
    items: CrisisSignal[];
    onItemClick: (signal: CrisisSignal) => void;
  }) {
    return (
      <div className="rounded-2xl border border-border-light bg-surface p-4 xl:p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-secondary">
            <Activity size={17} className="text-text-light" />
          </div>
          <h3 className="text-sm font-bold text-text-main">
            {t.psychologist.dashboardRecentActivityTitle}
          </h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={18} className="animate-spin text-text-light" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-text-light py-4 text-center">
            {t.psychologist.noActiveAlerts}
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => onItemClick(it)}
                  className="btn-press w-full flex items-start gap-2 text-left rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
                >
                  <CheckCircle2
                    size={14}
                    className={clsx(
                      "mt-0.5 shrink-0",
                      it.resolvedAt ? "text-success" : "text-text-light",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-main truncate">
                      {it.studentName}
                    </p>
                    <p className="text-[11px] text-text-light truncate">
                      {it.summary}
                    </p>
                  </div>
                  <span className="text-[11px] text-text-light font-medium shrink-0">
                    {formatTimeAgo(it.resolvedAt ?? it.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}
