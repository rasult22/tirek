import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { getStudent, detachStudent } from "../api/students.js";
import { directChatApi } from "../api/direct-chat.js";
import { achievementsApi } from "../api/achievements.js";
import { schoolsApi } from "../api/schools.js";
import { timelineApi } from "../api/timeline.js";
import { useAuthStore } from "../store/auth-store.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { StudentDetailHero } from "../components/student/StudentDetailHero.js";
import { StudentActionBar } from "../components/student/StudentActionBar.js";
import { MoodChart } from "../components/student/MoodChart.js";
import { AchievementsStack } from "../components/student/AchievementsStack.js";
import { StudentTestsSection } from "../components/student/StudentTestsSection.js";
import { StudentTimeline } from "../components/student/StudentTimeline.js";
import { calculateMoodTrend } from "../utils/mood-analytics.js";
import { openPrintProfile } from "../utils/print-profile.js";
import type { TimelineEventType } from "@tirek/shared";

type Filter = "all" | TimelineEventType;

export function StudentDetailPage() {
  const t = useT();
  const { language } = useLanguage();
  const d = t.psychologist.studentDetail;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const psychologist = useAuthStore((s) => s.user);

  const [printing, setPrinting] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [detaching, setDetaching] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudent(id!),
    enabled: !!id,
  });

  const { data: studentAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["achievements", id],
    queryFn: () => achievementsApi.getStudentAchievements(id!),
    enabled: !!id,
  });

  const timelineType: TimelineEventType | undefined =
    filter === "all" ? undefined : filter;

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["timeline", id, filter],
    queryFn: () =>
      timelineApi.getStudentTimeline(id!, { type: timelineType, limit: 100 }),
    enabled: !!id,
  });

  const moodTrend = useMemo(
    () => calculateMoodTrend(data?.moodHistory ?? [], 30),
    [data?.moodHistory],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-ink-muted" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const { student, status, reason, moodHistory, testResults } = data;
  const latestEntry =
    moodHistory.length > 0 ? moodHistory[moodHistory.length - 1] : undefined;

  async function handlePrint() {
    if (!psychologist) return;
    setPrinting(true);
    try {
      let schoolName: string | null = null;
      if (psychologist.schoolId) {
        try {
          const school = await schoolsApi.get(psychologist.schoolId);
          schoolName = school.name;
        } catch {
          schoolName = null;
        }
      }
      openPrintProfile(
        {
          schoolName,
          psychologistName: psychologist.name,
          student: {
            name: student.name,
            grade: student.grade,
            classLetter: student.classLetter,
          },
          moodHistory,
          testResults,
          today: new Date(),
          lang: language,
        },
        language,
      );
    } catch {
      toast.error(t.psychologist.printProfileFailed);
    } finally {
      setPrinting(false);
    }
  }

  async function handleMessage() {
    if (!id) return;
    setMessaging(true);
    try {
      const conv = await directChatApi.createConversation(id);
      navigate(`/messages/${conv.id}`);
    } catch {
      toast.error(t.common.actionFailed);
    } finally {
      setMessaging(false);
    }
  }

  function handleAssignTest() {
    navigate("/diagnostics");
  }

  async function handleDetach() {
    if (
      !window.confirm(
        `${t.psychologist.detachConfirmTitle}\n\n${t.psychologist.detachConfirmDescription}`,
      )
    )
      return;
    setDetaching(true);
    try {
      await detachStudent(id!);
      navigate("/students");
    } catch {
      toast.error(t.common.actionFailed);
    } finally {
      setDetaching(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button
        onClick={() => navigate("/students")}
        className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} />
        {t.common.back}
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <aside className="xl:col-span-5 xl:sticky xl:top-2 xl:self-start xl:max-h-[calc(100dvh-1rem)] xl:overflow-y-auto xl:pb-4 space-y-4">
          <StudentDetailHero student={student} status={status} reason={reason} />

          <MoodChart
            data={moodTrend.data}
            average={moodTrend.average}
            latestEntry={latestEntry}
            size="hero"
            rangeLabel={d.days30}
          />

          <StudentActionBar
            onMessage={handleMessage}
            onAssignTest={handleAssignTest}
            onPrint={handlePrint}
            messaging={messaging}
            printing={printing}
          />

          <AchievementsStack
            achievements={studentAchievements}
            loading={achievementsLoading}
          />

          <div className="pt-4 border-t border-border-light space-y-2">
            <div className="text-xs uppercase tracking-wider text-ink-muted font-semibold">
              {d.dangerZone}
            </div>
            <button
              onClick={handleDetach}
              disabled={detaching}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                bg-danger text-white text-sm font-medium hover:bg-danger/90 transition-colors
                btn-press disabled:opacity-60"
            >
              {detaching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UserMinus size={16} />
              )}
              {t.psychologist.detachStudent}
            </button>
          </div>
        </aside>

        <main className="xl:col-span-7 space-y-6">
          <StudentTestsSection testResults={testResults} />
          <StudentTimeline
            events={timeline?.data ?? []}
            loading={timelineLoading}
            filter={filter}
            onFilterChange={setFilter}
          />
        </main>
      </div>
    </div>
  );
}
