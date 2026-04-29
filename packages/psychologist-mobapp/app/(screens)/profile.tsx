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
import { Text, Card, Button, Input, Body, H2, H3 } from "../../components/ui";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { authApi } from "../../lib/api/auth";
import { useThemeColors, radius } from "../../lib/theme";
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
        {/* User card */}
        {!editing ? (
          <Card variant="floating" style={styles.userCard}>
            <View style={[styles.avatarWrap, { backgroundColor: ds.brandSoft }]}>
              <Ionicons name="person" size={36} color={c.primaryDark} />
            </View>
            <H2 style={styles.userName}>{user?.name}</H2>
            <Body style={{ color: c.textLight }}>{user?.email}</Body>
            <View style={[styles.roleBadge, { backgroundColor: ds.brandSoft }]}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: c.primaryDark }}>
                {t.psychologist.role}
              </Text>
            </View>
            <Pressable
              onPress={startEdit}
              style={({ pressed }) => [
                styles.editBtn,
                { backgroundColor: ds.brandSoft },
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
          <Card variant="floating" style={styles.editCard}>
            <H3 style={{ marginBottom: 16 }}>{t.common.edit}</H3>

            <Text variant="caption" style={{ marginBottom: 6 }}>
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
              <View style={[styles.sectionIcon, { backgroundColor: ds.brandSoft }]}>
                <Ionicons name="calendar-outline" size={18} color={c.primaryDark} />
              </View>
              <Body style={{ fontWeight: "700", flex: 1 }}>
                {t.officeHours.pageTitle}
              </Body>
              <Ionicons name="chevron-forward" size={18} color={c.textLight} />
            </View>
          </Card>
        </Pressable>

        {/* Language switcher */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: ds.brandSoft }]}>
              <Ionicons name="globe-outline" size={18} color={c.primaryDark} />
            </View>
            <Body style={{ fontWeight: "700", flex: 1 }}>
              {t.profile.language}
            </Body>
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
              <Body style={{ fontWeight: "600" }}>{t.common.appName}</Body>
              <Text variant="bodyXs" style={{ color: c.textLight, marginTop: 2 }}>
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
                { backgroundColor: ds.brandSoft },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="cloud-download-outline" size={16} color={c.primary} />
              <Text variant="bodyXs" style={{ color: c.primary, fontWeight: "600" }}>
                {t.profile.update}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Logout */}
        <Button
          title={t.auth.logout}
          variant="danger"
          onPress={() => setShowLogout(true)}
          style={styles.logoutBtn}
        />
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
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
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
    marginTop: 16,
  },
});
