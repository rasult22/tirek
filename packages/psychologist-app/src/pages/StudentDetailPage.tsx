import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useT } from "../hooks/useLanguage.js";
import { getStudent } from "../api/students.js";
import { getNotes, addNote, updateNote } from "../api/notes.js";
import { StatusBadge } from "../components/ui/StatusBadge.js";
import { SeverityBadge } from "../components/ui/SeverityBadge.js";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  X,
  Calendar,
  FileText,
  StickyNote,
  Edit3,
  Download,
  MessageSquare,
  Award,
  Lock,
  Brain,
} from "lucide-react";
import { clsx } from "clsx";
import { exportApi } from "../api/export.js";
import { directChatApi } from "../api/direct-chat.js";
import { achievementsApi } from "../api/achievements.js";
import { cbtApi } from "../api/cbt.js";
import { useLanguage } from "../hooks/useLanguage.js";
import type {
  CbtEntry,
  ThoughtDiaryData,
} from "@tirek/shared";

const moodColors: Record<number, string> = {
  1: "bg-danger",
  2: "bg-warning",
  3: "bg-yellow-400",
  4: "bg-success",
  5: "bg-emerald-400",
};

const moodEmojis: Record<number, string> = {
  1: "\u{1F622}",
  2: "\u{1F61F}",
  3: "\u{1F610}",
  4: "\u{1F60A}",
  5: "\u{1F929}",
};

type Tab = "overview" | "tests" | "notes" | "achievements" | "cbt";

export function StudentDetailPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudent(id!),
    enabled: !!id,
  });

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["notes", id],
    queryFn: () => getNotes(id!),
    enabled: !!id && activeTab === "notes",
  });

  const { data: studentAchievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["achievements", id],
    queryFn: () => achievementsApi.getStudentAchievements(id!),
    enabled: !!id && activeTab === "achievements",
  });

  const { data: cbtEntries, isLoading: cbtLoading } = useQuery({
    queryKey: ["cbt", id],
    queryFn: () => cbtApi.getStudentEntries(id!),
    enabled: !!id && activeTab === "cbt",
  });

  const addNoteMutation = useMutation({
    mutationFn: () => addNote(id!, { content: noteContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", id] });
      setNoteContent("");
      setShowNoteForm(false);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: () => updateNote(editingNoteId!, { content: noteContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", id] });
      setNoteContent("");
      setEditingNoteId(null);
      setShowNoteForm(false);
    },
  });

  function handleSaveNote() {
    if (editingNoteId) {
      updateNoteMutation.mutate();
    } else {
      addNoteMutation.mutate();
    }
  }

  function handleEditNote(noteId: string, content: string) {
    setEditingNoteId(noteId);
    setNoteContent(content);
    setShowNoteForm(true);
  }

  function cancelNote() {
    setNoteContent("");
    setEditingNoteId(null);
    setShowNoteForm(false);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-text-light" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-text-light">{t.common.error}</p>
        <button
          onClick={() => navigate("/students")}
          className="mt-4 text-primary hover:text-primary-dark text-sm font-medium"
        >
          {t.common.back}
        </button>
      </div>
    );
  }

  const { student, status, moodHistory, testResults } = data;

  const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: "overview", label: t.psychologist.moodHistory, icon: Calendar },
    { key: "tests", label: t.psychologist.testResults, icon: FileText },
    { key: "achievements", label: t.achievements.title, icon: Award },
    { key: "cbt", label: t.cbt.title, icon: Brain },
    { key: "notes", label: t.psychologist.notes, icon: StickyNote },
  ];

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => navigate("/students")}
        className="flex items-center gap-1.5 text-sm text-text-light hover:text-text-main transition-colors"
      >
        <ArrowLeft size={16} />
        {t.common.back}
      </button>

      {/* Header card */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-text-main truncate">{student.name}</h1>
              <StatusBadge status={status} size="sm" />
            </div>
            <p className="text-xs text-text-light mt-0.5 truncate">
              {student.grade != null
                ? `${student.grade}${student.classLetter ?? ""} class`
                : ""}{" "}
              &middot; {student.email}
            </p>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              directChatApi.createConversation(id!).then((conv) => {
                navigate(`/messages/${conv.id}`);
              });
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-primary text-xs
              font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <MessageSquare size={12} />
            {t.directChat.writeToStudent}
          </button>
          <button
            onClick={() => exportApi.studentCSV(id!)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-input-border text-xs
              font-medium text-text-main hover:bg-surface-hover transition-colors"
          >
            <Download size={12} />
            CSV
          </button>
        </div>
      </div>

      {/* Scrollable Tabs */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1 min-w-max border-b border-border pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-text-light hover:text-text-main",
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Mood chart */}
          <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <h2 className="text-sm font-semibold text-text-main mb-3">
              {t.psychologist.moodHistory} (30 days)
            </h2>
            {moodHistory.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {moodHistory.slice(-30).map((entry, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs",
                      moodColors[entry.mood] ?? "bg-gray-200",
                      "text-white font-medium",
                    )}
                    title={`${new Date(entry.createdAt).toLocaleDateString()}: ${entry.mood}/5`}
                  >
                    {moodEmojis[entry.mood] ?? entry.mood}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-light">{t.common.noData}</p>
            )}
          </div>

          {/* Status indicators */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface rounded-xl border border-border shadow-sm p-3 text-center">
              <p className="text-2xl mb-0.5">
                {moodHistory.length > 0
                  ? moodEmojis[moodHistory[moodHistory.length - 1].mood] ?? "\u2014"
                  : "\u2014"}
              </p>
              <p className="text-[10px] text-text-light">Last mood</p>
            </div>
            <div className="bg-surface rounded-xl border border-border shadow-sm p-3 text-center">
              <p className="text-xl font-bold text-text-main mb-0.5">
                {testResults.length}
              </p>
              <p className="text-[10px] text-text-light">Tests</p>
            </div>
            <div className="bg-surface rounded-xl border border-border shadow-sm p-3 text-center">
              <p className="text-xl font-bold text-text-main mb-0.5">
                {moodHistory.length}
              </p>
              <p className="text-[10px] text-text-light">Moods</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tests" && (
        <div>
          {testResults.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <FileText size={36} className="text-text-light mb-2" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-surface rounded-xl border border-border shadow-sm p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-main">
                        {result.testName ?? result.testSlug ?? result.testId}
                      </p>
                      <p className="text-xs text-text-light mt-0.5">
                        {result.completedAt
                          ? new Date(result.completedAt).toLocaleDateString()
                          : "\u2014"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {result.totalScore != null && (
                        <span className="text-sm font-bold text-text-main">
                          {result.totalScore}/{result.maxScore ?? "?"}
                        </span>
                      )}
                      {result.severity && <SeverityBadge severity={result.severity} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
          {achievementsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-text-light" />
            </div>
          ) : studentAchievements && studentAchievements.achievements.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-main">
                  {t.achievements.title}
                </h2>
                <span className="text-xs font-bold text-amber-600">
                  {studentAchievements.earnedCount} / {studentAchievements.totalCount}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {studentAchievements.achievements.map((item) => {
                  const name =
                    language === "kz" && item.achievement.nameKz
                      ? item.achievement.nameKz
                      : item.achievement.nameRu;
                  return (
                    <div
                      key={item.achievement.slug}
                      className={clsx(
                        "flex flex-col items-center rounded-xl p-2.5 border transition-all",
                        item.earned
                          ? "border-amber-200 bg-amber-50/50"
                          : "border-border-light bg-surface-secondary/50 opacity-50 grayscale",
                      )}
                    >
                      <span className="text-xl">{item.achievement.emoji}</span>
                      <span className="mt-1 text-center text-[10px] font-medium text-text-main leading-tight">
                        {name}
                      </span>
                      {item.earned && item.earnedAt ? (
                        <span className="mt-0.5 text-[9px] text-amber-600">
                          {new Date(item.earnedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <Lock size={9} className="mt-0.5 text-text-light" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-10">
              <Award size={36} className="text-text-light mb-2" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "cbt" && (
        <div>
          {cbtLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-text-light" />
            </div>
          ) : cbtEntries && cbtEntries.data.length > 0 ? (
            <div className="space-y-3">
              {cbtEntries.data.map((entry: CbtEntry) => {
                const typeLabels: Record<string, string> = {
                  thought_diary: t.cbt.thoughtDiary,
                };
                const typeColors: Record<string, string> = {
                  thought_diary: "bg-violet-100 text-violet-700",
                };
                return (
                  <div
                    key={entry.id}
                    className="bg-surface rounded-xl border border-border shadow-sm p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          typeColors[entry.type] ?? "bg-surface-secondary text-gray-700",
                        )}
                      >
                        {typeLabels[entry.type] ?? entry.type}
                      </span>
                      <span className="text-xs text-text-light">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-text-main space-y-1">
                      {entry.type === "thought_diary" && (() => {
                        const d = entry.data as ThoughtDiaryData;
                        return (
                          <>
                            <p><span className="font-medium text-text-light">{t.cbt.situation}:</span> {d.situation}</p>
                            <p><span className="font-medium text-text-light">{t.cbt.thought}:</span> {d.thought}</p>
                            <p><span className="font-medium text-text-light">{t.cbt.emotion}:</span> {d.emotion}{d.emotionIntensity ? ` (${d.emotionIntensity}/10)` : ""}</p>
                            {d.distortion && <p><span className="font-medium text-text-light">{t.cbt.distortion}:</span> {d.distortion}</p>}
                            {d.alternative && <p><span className="font-medium text-text-light">{t.cbt.alternative}:</span> {d.alternative}</p>}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10">
              <Brain size={36} className="text-text-light mb-2" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-3">
          {!showNoteForm && (
            <button
              onClick={() => {
                setEditingNoteId(null);
                setNoteContent("");
                setShowNoteForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium
                hover:bg-primary-dark transition-colors"
            >
              <Plus size={16} />
              {t.psychologist.addNote}
            </button>
          )}

          {showNoteForm && (
            <div className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text-main">
                  {editingNoteId ? t.common.edit : t.psychologist.addNote}
                </h3>
                <button
                  onClick={cancelNote}
                  className="p-1 hover:bg-surface-hover rounded text-text-light"
                >
                  <X size={16} />
                </button>
              </div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-input-border bg-surface text-sm
                  text-text-main placeholder:text-text-light resize-none
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Write your note..."
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={cancelNote}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-text-light hover:bg-surface-hover"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={
                    !noteContent.trim() ||
                    addNoteMutation.isPending ||
                    updateNoteMutation.isPending
                  }
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm
                    font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  <Save size={14} />
                  {t.common.save}
                </button>
              </div>
            </div>
          )}

          {notesLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-text-light" />
            </div>
          ) : notes && notes.data.length > 0 ? (
            <div className="space-y-2">
              {notes.data.map((note) => (
                <div
                  key={note.id}
                  className="bg-surface rounded-xl border border-border shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-xs text-text-light">
                      {new Date(note.createdAt).toLocaleString()}
                      {note.updatedAt !== note.createdAt && (
                        <span className="ml-1 italic">
                          (edited)
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => handleEditNote(note.id, note.content)}
                      className="p-1 hover:bg-surface-hover rounded text-text-light hover:text-primary"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-text-main whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border shadow-sm p-6 text-center">
              <StickyNote size={28} className="text-text-light mx-auto mb-2" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
