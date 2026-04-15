import { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Text, Button, Card } from "../../components/ui";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { authApi } from "../../lib/api/auth";
import { useThemeColors, useTheme, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import type { Language } from "@tirek/shared";
import type { ThemeMode } from "../../lib/theme";

const AVATAR_MAP: Record<string, string> = {
  "avatar-1": "😊",
  "avatar-2": "🤩",
  "avatar-3": "🦊",
  "avatar-4": "🐱",
  "avatar-5": "🚀",
  "avatar-6": "🌻",
};

const AVATAR_IDS = Object.keys(AVATAR_MAP);

const THEME_OPTIONS: { value: ThemeMode; icon: "phone-portrait-outline" | "sunny-outline" | "moon-outline" }[] = [
  { value: "system", icon: "phone-portrait-outline" },
  { value: "light", icon: "sunny-outline" },
  { value: "dark", icon: "moon-outline" },
];

export default function ProfileScreen() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const { mode, setMode } = useTheme();
  const c = useThemeColors();
  const { replace } = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editAvatar, setEditAvatar] = useState(user?.avatarId ?? "");

  const saveMutation = useMutation({
    mutationFn: () =>
      authApi.updateProfile({ name: editName, avatarId: editAvatar || null }),
    onSuccess: (data) => {
      updateUser({ name: data.name, avatarId: data.avatarId });
      setEditing(false);
    },
  });

  const handleLogout = () => {
    logout();
    replace("/(auth)/login");
  };

  const startEdit = () => {
    setEditName(user?.name ?? "");
    setEditAvatar(user?.avatarId ?? "");
    setEditing(true);
  };

  const themeLabels: Record<ThemeMode, string> = {
    system: t.profile.themeSystem,
    light: t.profile.themeLight,
    dark: t.profile.themeDark,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text variant="h2" style={{ paddingTop: spacing.sm }}>
          {t.profile.title}
        </Text>

        {/* User card */}
        {!editing ? (
          <Card elevated style={styles.userCard}>
            <View
              style={[
                styles.avatarWrap,
                { backgroundColor: `${c.primary}14` },
              ]}
            >
              {user?.avatarId && AVATAR_MAP[user.avatarId] ? (
                <Text style={styles.avatarEmoji}>
                  {AVATAR_MAP[user.avatarId]}
                </Text>
              ) : (
                <Ionicons
                  name="person"
                  size={36}
                  color={c.primaryDark}
                />
              )}
            </View>
            <Text variant="h2" style={styles.userName}>
              {user?.name}
            </Text>
            <Text variant="bodyLight">{user?.email}</Text>
            {user?.grade && (
              <View
                style={[
                  styles.gradeBadge,
                  { backgroundColor: `${c.primary}14` },
                ]}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: c.primaryDark }}>
                  {user.grade}
                  {user.classLetter ?? ""}
                </Text>
              </View>
            )}
            <Pressable
              onPress={startEdit}
              style={({ pressed }) => [
                styles.editBtn,
                { backgroundColor: `${c.primary}14` },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="pencil" size={14} color={c.primaryDark} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: c.primaryDark }}>
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

            <Text
              variant="caption"
              style={{ marginTop: 20, marginBottom: 8 }}
            >
              {t.auth.selectAvatar}
            </Text>
            <View style={styles.avatarRow}>
              {AVATAR_IDS.map((id) => (
                <Pressable
                  key={id}
                  onPress={() => setEditAvatar(id)}
                  style={[
                    styles.avatarOption,
                    { backgroundColor: c.surfaceSecondary },
                    editAvatar === id && {
                      backgroundColor: `${c.primary}1A`,
                      borderWidth: 2,
                      borderColor: c.primary,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 24 }}>{AVATAR_MAP[id]}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.editActions}>
              <Pressable
                onPress={() => setEditing(false)}
                style={[styles.cancelBtn, { borderColor: c.borderLight }]}
              >
                <Ionicons name="close" size={14} color={c.textLight} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: c.textLight }}>
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

        {/* Theme switcher */}
        <Card style={styles.langCard}>
          <View style={styles.langHeader}>
            <View
              style={[
                styles.langIcon,
                { backgroundColor: `${c.primary}14` },
              ]}
            >
              <Ionicons name="color-palette-outline" size={18} color={c.primaryDark} />
            </View>
            <Text variant="body" style={{ fontWeight: "700", flex: 1 }}>
              {t.profile.theme}
            </Text>
          </View>
          <View style={styles.themeBtns}>
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setMode(opt.value)}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor:
                      mode === opt.value ? c.primary : c.surfaceSecondary,
                  },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={16}
                  color={mode === opt.value ? "#FFFFFF" : c.textLight}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: mode === opt.value ? "#FFFFFF" : c.textLight,
                    marginTop: 4,
                  }}
                >
                  {themeLabels[opt.value]}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Language switcher */}
        <Card style={styles.langCard}>
          <View style={styles.langHeader}>
            <View
              style={[
                styles.langIcon,
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

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // User card
  userCard: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 28,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 36,
  },
  userName: {
    marginTop: 16,
  },
  gradeBadge: {
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
    marginTop: 20,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  avatarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
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

  // Theme
  themeBtns: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  themeBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },

  // Language
  langCard: {
    marginTop: 16,
  },
  langHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  langIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
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
