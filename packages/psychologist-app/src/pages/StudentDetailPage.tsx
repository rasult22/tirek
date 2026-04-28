import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  ClipboardList,
  Printer,
  UserMinus,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useT, useLanguage } from "../hooks/useLanguage.js";
import { getStudent, detachStudent } from "../api/students.js";
import { directChatApi } from "../api/direct-chat.js";
import { achievementsApi } from "../api/achievements.js";
import { cbtApi } from "../api/cbt.js";
import { schoolsApi } from "../api/schools.js";
import { useAuthStore } from "../store/auth-store.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { StudentHeroCard } from "../components/student/StudentHeroCard.js";
import { StudentOverviewTab } from "../components/student/StudentOverviewTab.js";
import { StudentAssessmentsTab } from "../components/student/StudentAssessmentsTab.js";
import { calculateMoodTrend, calculateEngagement } from "../utils/mood-analytics.js";
import { openPrintProfile } from "../utils/print-profile.js";

type Tab = "overview" | "assessments";

export function StudentDetailPage() {
  const t = useT();
  const { language } = useLanguage();
  const d = t.psychologist.studentDetail;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const psychologist = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [printing, setPrinting] = useState(false);
  const [detaching, setDetaching] = useState(false);

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

  const { data: cbtEntries, isLoading: cbtLoading } = useQuery({
    queryKey: ["cbt", id],
    queryFn: () => cbtApi.getStudentEntries(id!),
    enabled: !!id,
  });

  const moodTrend = useMemo(
    () => calculateMoodTrend(data?.moodHistory ?? []),
    [data?.moodHistory],
  );

  const engagement = useMemo(
    () => calculateEngagement(
      data?.moodHistory ?? [],
      data?.testResults ?? [],
      cbtEntries?.data,
    ),
    [data?.moodHistory, data?.testResults, cbtEntries?.data],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-text-light" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const { student, status, reason, moodHistory, testResults } = data;

  const tabs: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
    { key: "overview", label: d.overview, icon: ClipboardList },
    { key: "assessments", label: d.assessments, icon: ClipboardList },
  ];

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
    <div className="space-y-4">
      {/* Header: back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/students")}
          className="flex items-center gap-1.5 text-sm text-text-light hover:text-text-main transition-colors"
        >
          <ArrowLeft size={16} />
          {t.common.back}
        </button>
        <button
          onClick={() => {
            directChatApi.createConversation(id!).then((conv) => {
              navigate(`/messages/${conv.id}`);
            }).catch(() => toast.error(t.common.actionFailed));
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs
            font-medium hover:bg-primary-dark transition-colors btn-press"
        >
          <MessageSquare size={14} />
          {t.directChat.writeToStudent}
        </button>
      </div>

      {/* Hero card */}
      <StudentHeroCard
        student={student}
        status={status}
        reason={reason}
        moodTrend={moodTrend}
        engagement={engagement}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-secondary/70 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all",
              activeTab === tab.key
                ? "bg-surface shadow-sm text-primary"
                : "text-text-light hover:text-text-main",
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <StudentOverviewTab
          moodTrend={moodTrend}
          moodHistory={moodHistory}
          testResults={testResults}
          cbtEntries={cbtEntries?.data}
          cbtLoading={cbtLoading}
          achievements={studentAchievements}
          achievementsLoading={achievementsLoading}
          onSwitchToAssessments={() => setActiveTab("assessments")}
        />
      )}

      {activeTab === "assessments" && (
        <StudentAssessmentsTab
          testResults={testResults}
          cbtEntries={cbtEntries?.data}
          cbtLoading={cbtLoading}
          achievements={studentAchievements}
          achievementsLoading={achievementsLoading}
        />
      )}

      {/* Danger Zone */}
      <div className="pt-6 mt-6 border-t border-border space-y-2">
        <div className="text-xs uppercase tracking-wider text-text-light font-semibold">
          {d.dangerZone}
        </div>
        <button
          onClick={handlePrint}
          disabled={printing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
            bg-surface-secondary border border-border text-sm font-medium text-text-main
            hover:bg-surface-secondary/70 transition-colors btn-press disabled:opacity-60"
        >
          {printing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Printer size={16} />
          )}
          {t.psychologist.printProfile}
        </button>
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
    </div>
  );
}
