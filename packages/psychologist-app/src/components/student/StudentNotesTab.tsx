import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save, X, StickyNote, Edit3 } from "lucide-react";
import { useT } from "../../hooks/useLanguage.js";
import { addNote, updateNote } from "../../api/notes.js";
import type { PsychologistNote } from "@tirek/shared";

interface StudentNotesTabProps {
  studentId: string;
  notes?: { data: PsychologistNote[] };
  notesLoading: boolean;
}

export function StudentNotesTab({ studentId, notes, notesLoading }: StudentNotesTabProps) {
  const t = useT();
  const d = t.psychologist.studentDetail;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: () => addNote(studentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", studentId] });
      setContent("");
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateNote(editingId!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", studentId] });
      setContent("");
      setEditingId(null);
      setShowForm(false);
    },
  });

  function handleSave() {
    if (editingId) updateMutation.mutate();
    else addMutation.mutate();
  }

  function handleEdit(noteId: string, noteContent: string) {
    setEditingId(noteId);
    setContent(noteContent);
    setShowForm(true);
  }

  function handleCancel() {
    setContent("");
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div className="space-y-3">
      {!showForm && (
        <button
          onClick={() => {
            setEditingId(null);
            setContent("");
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium
            hover:bg-primary-dark transition-colors btn-press"
        >
          <Plus size={16} />
          {t.psychologist.addNote}
        </button>
      )}

      {showForm && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-4 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-text-main">
              {editingId ? t.common.edit : t.psychologist.addNote}
            </h3>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-surface-hover rounded text-text-light"
            >
              <X size={16} />
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-input-border bg-surface text-sm
              text-text-main placeholder:text-text-light resize-none
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder={d.notePlaceholder}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancel}
              className="px-3 py-2 rounded-lg text-sm font-medium text-text-light hover:bg-surface-hover"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim() || addMutation.isPending || updateMutation.isPending}
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
                    <span className="ml-1 italic">({d.edited})</span>
                  )}
                </p>
                <button
                  onClick={() => handleEdit(note.id, note.content)}
                  className="p-1 hover:bg-surface-hover rounded text-text-light hover:text-primary"
                >
                  <Edit3 size={14} />
                </button>
              </div>
              <p className="text-sm text-text-main whitespace-pre-wrap">{note.content}</p>
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
  );
}
