import { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Text, Card } from "../../components/ui";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { authApi } from "../../lib/api/auth";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { checkForUpdate } from "../../lib/updates";
import { hapticLight } from "../../lib/haptics";
import type { Language } from "@tirek/shared";

export default function ProfileScreen() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const c = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [showLogout, setShowLogout] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => authApi.updateProfile({ name: editName }),
    onSuccess: (data) => {
      updateUser({ name: data.name });
      setEditing(false);
    },
  });

  const handleLogout = () => {
    setShowLogout(false);
    logout();
    queryClient.clear();
    router.replace("/(auth)/login");
  };

  const startEdit = () => {
    setEditName(user?.name ?? "");
    setEditing(true);
  };

  return (
    <>
      <Stack.Screen options={{ title: t.profile.title }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: c.bg }}
      >
        {/* User card */}
        {!editing ? (
          <Card elevated style={styles.userCard}>
            <View
              style={[
                styles.avatarWrap,
                { backgroundColor: `${c.primary}14` },
              ]}
            >
              <Ionicons name="person" size={36} color={c.primaryDark} />
            </View>
            <Text variant="h2" style={styles.userName}>
              {user?.name}
            </Text>
            <Text variant="bodyLight">{user?.email}</Text>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: `${c.primary}14` },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: c.primaryDark,
                }}
              >
                {t.psychologist.role}
              </Text>
            </View>
            <Pressable
              onPress={startEdit}
              style={({ pressed }) => [
                styles.editBtn,
                { backgroundColor: `${c.primary}14` },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="pencil" size={14} color={c.primaryDark} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: c.primaryDark,
                }}
              >
                {t.common.edit}
              </Text>
            </Pressable>
          </Card>
        ) : (
          <Card elevated style={styles.editCard}>
            <Text variant="h3" style={{ marginBottom: 16 }}>
              {t.common.edit}
            </Text>

            <Text variant="caption" style={{ marginBottom: 6 }}>
              {t.auth.name}
            </Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[
                styles.editInput,
                {
                  borderColor: c.borderLight,
                  backgroundColor: c.surfaceSecondary,
                  color: c.text,
                },
              ]}
              placeholderTextColor={c.textLight}
            />

            <View style={styles.editActions}>
              <Pressable
                onPress={() => setEditing(false)}
                style={[styles.cancelBtn, { borderColor: c.borderLight }]}
              >
                <Ionicons name="close" size={14} color={c.textLight} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: c.textLight,
                  }}
                >
                  {t.common.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !editName.trim()}
                style={[
                  styles.saveBtn,
                  { backgroundColor: c.primary },
                  (saveMutation.isPending || !editName.trim()) && {
                    opacity: 0.5,
                  },
                ]}
              >
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                <Text style={styles.saveText}>{t.common.save}</Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* My schedule */}
        <Pressable
          onPress={() => {
            hapticLight();
            router.push("/(screens)/office-hours");
          }}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <Card style={styles.sectionCard}>
            <View style={styles.scheduleRow}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: `${c.primary}14` },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={c.primaryDark}
                />
              </View>
              <Text variant="body" style={{ fontWeight: "700", flex: 1 }}>
                {t.officeHours.pageTitle}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={c.textLight}
              />
            </View>
          </Card>
        </Pressable>

        {/* Language switcher */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: `${c.primary}14` },
              ]}
            >
              <Ionicons
                name="globe-outline"
                size={18}
                color={c.primaryDark}
              />
            </View>
            <Text variant="body" style={{ fontWeight: "700", flex: 1 }}>
              {t.profile.language}
            </Text>
          </View>
          <View style={styles.langBtns}>
            {(["ru", "kz"] as Language[]).map((lang) => (
              <Pressable
                key={lang}
                onPress={() => setLanguage(lang)}
                style={[
                  styles.langBtn,
                  {
                    backgroundColor:
                      language === lang ? c.primary : c.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: language === lang ? "#FFFFFF" : c.textLight,
                  }}
                >
                  {lang === "ru" ? "Русский" : "Қазақша"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* App version & updates */}
        <Card style={styles.sectionCard}>
          <View style={styles.versionRow}>
            <View style={{ flex: 1 }}>
              <Text variant="body" style={{ fontWeight: "600" }}>
                {t.common.appName}
              </Text>
              <Text variant="small" style={{ color: c.textLight, marginTop: 2 }}>
                v{Constants.expoConfig?.version ?? "1.0.0"}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                hapticLight();
                checkForUpdate();
              }}
              style={({ pressed }) => [
                styles.updateBtn,
                { backgroundColor: `${c.primary}1A` },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="cloud-download-outline" size={16} color={c.primary} />
              <Text variant="small" style={{ color: c.primary, fontWeight: "600" }}>
                {t.profile.update}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Logout */}
        <Pressable
          onPress={() => setShowLogout(true)}
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              borderColor: `${c.danger}33`,
              backgroundColor: `${c.danger}0A`,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={c.danger} />
          <Text style={{ fontSize: 14, fontWeight: "700", color: c.danger }}>
            {t.auth.logout}
          </Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        open={showLogout}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
        title={t.auth.logout}
        description={t.common.confirmDeleteDescription}
        confirmLabel={t.auth.logout}
        variant="danger"
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },

  // User card
  userCard: {
    alignItems: "center",
    paddingVertical: 28,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    marginTop: 16,
  },
  roleBadge: {
    marginTop: 8,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  // Edit card
  editCard: {
    marginBottom: 0,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  saveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Sections
  sectionCard: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  // Language
  langBtns: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  langBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },

  // Version
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
  },
});
