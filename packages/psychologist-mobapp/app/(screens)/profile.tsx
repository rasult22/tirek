import { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Text, Button, Input, Body } from "../../components/ui";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { authApi } from "../../lib/api/auth";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { colors as ds } from "@tirek/shared/design-system";
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
          {/* Identity hero */}
          {!editing ? (
            <View style={styles.hero}>
              <View
                style={[styles.avatarWrap, { backgroundColor: ds.brandSoft }]}
              >
                <Ionicons name="person" size={36} color={c.primaryDark} />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  lineHeight: 26,
                  fontFamily: "Inter_700Bold",
                  color: c.text,
                  marginTop: spacing.md,
                }}
              >
                {user?.name}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  color: c.textLight,
                  marginTop: 2,
                }}
              >
                {user?.email}
              </Text>
              <View
                style={[styles.roleBadge, { backgroundColor: ds.brandSoft }]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Inter_700Bold",
                    color: c.primaryDark,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  {t.psychologist.role}
                </Text>
              </View>
              <Pressable
                onPress={startEdit}
                style={({ pressed }) => [
                  styles.editBtn,
                  { borderColor: c.borderLight },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="pencil-outline" size={14} color={c.text} />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Inter_600SemiBold",
                    color: c.text,
                  }}
                >
                  {t.common.edit}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.editCard,
                { backgroundColor: c.surface, borderColor: c.borderLight },
              ]}
            >
              <Text style={[styles.editTitle, { color: c.text }]}>
                {t.common.edit}
              </Text>
              <Text
                style={[styles.fieldLabel, { color: c.textLight }]}
              >
                {t.auth.name}
              </Text>
              <Input value={editName} onChangeText={setEditName} />
              <View style={styles.editActions}>
                <Button
                  title={t.common.cancel}
                  variant="secondary"
                  onPress={() => setEditing(false)}
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button
                  title={t.common.save}
                  variant="primary"
                  onPress={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !editName.trim()}
                  loading={saveMutation.isPending}
                  size="md"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* Settings list */}
          <Text style={[styles.sectionEyebrow, { color: c.textLight }]}>
            {t.profile.title}
          </Text>
          <View
            style={[
              styles.settingsCard,
              { backgroundColor: c.surface, borderColor: c.borderLight },
            ]}
          >
            <Pressable
              onPress={() => {
                hapticLight();
                router.push("/(screens)/office-hours");
              }}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: c.borderLight, borderBottomWidth: 1 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View
                style={[styles.rowIcon, { backgroundColor: ds.brandSoft }]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={c.primaryDark}
                />
              </View>
              <Body style={{ fontFamily: "Inter_600SemiBold", flex: 1 }}>
                {t.officeHours.pageTitle}
              </Body>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={c.textLight}
              />
            </Pressable>

            <View
              style={[
                styles.row,
                { borderBottomColor: c.borderLight, borderBottomWidth: 1 },
              ]}
            >
              <View
                style={[styles.rowIcon, { backgroundColor: ds.brandSoft }]}
              >
                <Ionicons
                  name="globe-outline"
                  size={18}
                  color={c.primaryDark}
                />
              </View>
              <Body style={{ fontFamily: "Inter_600SemiBold", flex: 1 }}>
                {t.profile.language}
              </Body>
              <View style={styles.langBtns}>
                {(["ru", "kz"] as Language[]).map((lang) => (
                  <Pressable
                    key={lang}
                    onPress={() => {
                      hapticLight();
                      setLanguage(lang);
                    }}
                    style={[
                      styles.langBtn,
                      {
                        backgroundColor:
                          language === lang
                            ? c.primary
                            : c.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_700Bold",
                        color:
                          language === lang ? "#FFFFFF" : c.textLight,
                      }}
                    >
                      {lang === "ru" ? "RU" : "KZ"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View
                style={[styles.rowIcon, { backgroundColor: ds.brandSoft }]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={c.primaryDark}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Body style={{ fontFamily: "Inter_600SemiBold" }}>
                  {t.common.appName}
                </Body>
                <Text
                  style={{
                    fontSize: 11,
                    lineHeight: 14,
                    color: c.textLight,
                    marginTop: 2,
                  }}
                >
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
                  { borderColor: c.borderLight },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons
                  name="cloud-download-outline"
                  size={14}
                  color={c.text}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_600SemiBold",
                    color: c.text,
                  }}
                >
                  {t.profile.update}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Logout — at the bottom, danger-styled */}
          <View style={{ height: spacing.lg }} />
          <Pressable
            onPress={() => setShowLogout(true)}
            style={({ pressed }) => [
              styles.dangerRow,
              {
                backgroundColor: c.surface,
                borderColor: `${c.danger}33`,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View
              style={[styles.rowIcon, { backgroundColor: `${c.danger}1A` }]}
            >
              <Ionicons name="log-out-outline" size={18} color={c.danger} />
            </View>
            <Body style={{ fontFamily: "Inter_600SemiBold", flex: 1, color: c.danger }}>
              {t.auth.logout}
            </Body>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={c.danger}
            />
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
    paddingTop: spacing.md,
  },

  // Identity hero
  hero: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadge: {
    marginTop: 10,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },

  // Edit card
  editCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  editTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  editActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  // Sections
  sectionEyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  settingsCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  langBtns: {
    flexDirection: "row",
    gap: 4,
  },
  langBtn: {
    width: 36,
    height: 28,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  // Danger
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
});
