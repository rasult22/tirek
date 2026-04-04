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
} from "lucide-react";
import { clsx } from "clsx";
import { exportApi } from "../api/export.js";
import { directChatApi } from "../api/direct-chat.js";

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

type Tab = "overview" | "tests" | "notes";

export function StudentDetailPage() {
  const t = useT();
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
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-text-light" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20">
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
    { key: "notes", label: t.psychologist.notes, icon: StickyNote },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/students")}
        className="flex items-center gap-1.5 text-sm text-text-light hover:text-text-main transition-colors"
      >
        <ArrowLeft size={16} />
        {t.common.back}
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-main">{student.name}</h1>
            <p className="text-sm text-text-light mt-0.5">
              {student.grade != null
                ? `${student.grade}${student.classLetter ?? ""} class`
                : ""}{" "}
              &middot; {student.email}
            </p>
          </div>
          <StatusBadge status={status} />
          <button
            onClick={() => {
              directChatApi.createConversation(id!).then((conv) => {
                navigate(`/messages/${conv.id}`);
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary text-xs
              font-medium text-primary hover:bg-primary/5 transition-colors shrink-0"
          >
            <MessageSquare size={12} />
            {t.directChat.writeToStudent}
          </button>
          <button
            onClick={() => exportApi.studentCSV(id!)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-xs
              font-medium text-text-main hover:bg-gray-50 transition-colors shrink-0"
          >
            <Download size={12} />
            CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-text-light hover:text-text-main",
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Mood chart - last 30 days as colored dots */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-text-main mb-4">
              {t.psychologist.moodHistory} (30 days)
            </h2>
            {moodHistory.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {moodHistory.slice(-30).map((entry, i) => (
                  <div
                    key={i}
                    className="group relative"
                  >
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs",
                        moodColors[entry.mood] ?? "bg-gray-200",
                        "text-white font-medium",
                      )}
                      title={`${new Date(entry.createdAt).toLocaleDateString()}: ${entry.mood}/5`}
                    >
                      {moodEmojis[entry.mood] ?? entry.mood}
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {new Date(entry.createdAt).toLocaleDateString()} &middot; {entry.mood}/5
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-light">{t.common.noData}</p>
            )}
          </div>

          {/* Current status indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <p className="text-3xl mb-1">
                {moodHistory.length > 0
                  ? moodEmojis[moodHistory[moodHistory.length - 1].mood] ?? "\u2014"
                  : "\u2014"}
              </p>
              <p className="text-xs text-text-light">Last mood</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-text-main mb-1">
                {testResults.length}
              </p>
              <p className="text-xs text-text-light">Tests completed</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-text-main mb-1">
                {moodHistory.length}
              </p>
              <p className="text-xs text-text-light">Mood entries</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tests" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {testResults.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <FileText size={40} className="text-text-light mb-3" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-semibold text-text-light">Date</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-light">Test</th>
                    <th className="text-center px-5 py-3 font-semibold text-text-light">Score</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-light">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-5 py-3.5 text-text-light">
                        {result.completedAt
                          ? new Date(result.completedAt).toLocaleDateString()
                          : "\u2014"}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-text-main">
                        {result.testName ?? result.testSlug ?? result.testId}
                      </td>
                      <td className="px-5 py-3.5 text-center text-text-main">
                        {result.totalScore != null
                          ? `${result.totalScore}/${result.maxScore ?? "?"}`
                          : "\u2014"}
                      </td>
                      <td className="px-5 py-3.5">
                        {result.severity ? (
                          <SeverityBadge severity={result.severity} />
                        ) : (
                          "\u2014"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-4">
          {/* Add note button */}
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

          {/* Note form */}
          {showNoteForm && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-main">
                  {editingNoteId ? t.common.edit : t.psychologist.addNote}
                </h3>
                <button
                  onClick={cancelNote}
                  className="p-1 hover:bg-gray-100 rounded text-text-light"
                >
                  <X size={16} />
                </button>
              </div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
                  text-text-main placeholder:text-text-light resize-none
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Write your note..."
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={cancelNote}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-light hover:bg-gray-100"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm
                    font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  <Save size={14} />
                  {t.common.save}
                </button>
              </div>
            </div>
          )}

          {/* Notes list */}
          {notesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-text-light" />
            </div>
          ) : notes && notes.data.length > 0 ? (
            <div className="space-y-3">
              {notes.data.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-text-light">
                      {new Date(note.createdAt).toLocaleString()}
                      {note.updatedAt !== note.createdAt && (
                        <span className="ml-2 italic">
                          (edited {new Date(note.updatedAt).toLocaleString()})
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => handleEditNote(note.id, note.content)}
                      className="p-1 hover:bg-gray-100 rounded text-text-light hover:text-primary"
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <StickyNote size={32} className="text-text-light mx-auto mb-2" />
              <p className="text-sm text-text-light">{t.common.noData}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
