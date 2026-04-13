import { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../lib/hooks/useLanguage";
import { Text, Card, Button } from "../ui";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { notesApi } from "../../lib/api/notes";
import type { PsychologistNote } from "@tirek/shared";

interface StudentNotesTabProps {
  studentId: string;
  notes?: { data: PsychologistNote[] };
  notesLoading: boolean;
}

export function StudentNotesTab({
  studentId,
  notes,
  notesLoading,
}: StudentNotesTabProps) {
  const t = useT();
  const c = useThemeColors();
  const d = t.psychologist.studentDetail;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: () => notesApi.add(studentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", studentId] });
      setContent("");
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => notesApi.update(editingId!, { content }),
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
    <View style={styles.container}>
      {!showForm && (
        <Button
          variant="primary"
          title={t.psychologist.addNote}
          onPress={() => {
            setEditingId(null);
            setContent("");
            setShowForm(true);
          }}
        />
      )}

      {showForm && (
        <Card>
          <View style={styles.formHeader}>
            <Text variant="h3">
              {editingId ? t.common.edit : t.psychologist.addNote}
            </Text>
            <Pressable onPress={handleCancel} hitSlop={8}>
              <Ionicons name="close" size={18} color={c.textLight} />
            </Pressable>
          </View>
          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder={d.notePlaceholder}
            placeholderTextColor={c.textLight}
            style={[
              styles.textInput,
              {
                borderColor: c.inputBorder,
                backgroundColor: c.surface,
                color: c.text,
              },
            ]}
          />
          <View style={styles.formActions}>
            <Button
              variant="ghost"
              title={t.common.cancel}
              onPress={handleCancel}
            />
            <Button
              variant="primary"
              title={t.common.save}
              onPress={handleSave}
              loading={addMutation.isPending || updateMutation.isPending}
              disabled={!content.trim()}
            />
          </View>
        </Card>
      )}

      {notesLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={c.textLight} />
        </View>
      ) : notes && notes.data.length > 0 ? (
        <View style={styles.notesList}>
          {notes.data.map((note) => (
            <Card key={note.id}>
              <View style={styles.noteHeader}>
                <Text variant="small" style={{ color: c.textLight }}>
                  {new Date(note.createdAt).toLocaleString()}
                  {note.updatedAt !== note.createdAt && (
                    <Text
                      variant="small"
                      style={{ fontStyle: "italic", color: c.textLight }}
                    >
                      {" "}
                      ({d.edited})
                    </Text>
                  )}
                </Text>
                <Pressable
                  onPress={() => handleEdit(note.id, note.content)}
                  hitSlop={8}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={c.textLight}
                  />
                </Pressable>
              </View>
              <Text variant="body">{note.content}</Text>
            </Card>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: `${c.textLight}1A` },
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={28}
              color={c.textLight}
            />
          </View>
          <Text variant="bodyLight">{t.common.noData}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 14,
    fontFamily: "DMSans-Regular",
    minHeight: 80,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  centered: {
    paddingVertical: 24,
    alignItems: "center",
  },
  notesList: {
    gap: spacing.sm,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
