import { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Text, Input, Button, Sheet } from "../../components/ui";
import { colors as ds, radius, spacing } from "@tirek/shared/design-system";
import { useT } from "../../lib/hooks/useLanguage";
import { authApi } from "../../lib/api/auth";
import { ApiError } from "../../lib/api/client";
import { useAuthStore } from "../../lib/store/auth-store";
import { useThemeColors } from "../../lib/theme";

const HERO_HEIGHT = 200;
const SHEET_OVERLAP = 32;
const MIN_PASSWORD_LENGTH = 6;

export default function NewPasswordScreen() {
  const t = useT();
  const router = useRouter();
  const c = useThemeColors();
  const setAuth = useAuthStore((s) => s.setAuth);
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const email = (params.email ?? "").trim();
  const code = (params.code ?? "").trim();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      authApi.resetPassword({ email, code, newPassword: password }),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      // Решение, куда вести юзера (онбординг vs (tabs)), принимает app/index.tsx
      // на основе user.onboardingCompleted с сервера.
      router.replace("/");
    },
  });

  const isValid =
    password.length >= MIN_PASSWORD_LENGTH && password === confirmPassword;

  const isApiError = mutation.isError && mutation.error instanceof ApiError;
  const errorMessage = isApiError
    ? t.auth.invalidCode
    : t.auth.connectionError;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.hero} edges={["top"]}>
        <View style={styles.heroInner}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color={ds.onDark} />
          </Pressable>
          <View style={styles.wordmarkWrap}>
            <Text style={styles.wordmark}>tirek.</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.kavWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Sheet variant="over-hero" overlap={SHEET_OVERLAP}>
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>{t.auth.newPasswordTitle}</Text>
            <Text style={[styles.desc, { color: c.textLight }]}>
              {t.auth.newPasswordDesc}
            </Text>

            <View style={styles.form}>
              <View style={styles.passwordWrap}>
                <Input
                  icon="lock-closed-outline"
                  placeholder={t.auth.newPasswordPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={c.textLight}
                  />
                </Pressable>
              </View>

              {password.length > 0 && password.length < MIN_PASSWORD_LENGTH && (
                <Text style={styles.hint}>{t.auth.passwordTooShort}</Text>
              )}

              <Input
                icon="lock-closed-outline"
                placeholder={t.auth.repeatPasswordPlaceholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.hint}>{t.auth.passwordsDoNotMatch}</Text>
              )}

              {mutation.isError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <Button
                title={t.auth.changePassword}
                onPress={() => mutation.mutate()}
                loading={mutation.isPending}
                disabled={!isValid}
                size="lg"
              />
            </View>
          </ScrollView>
        </Sheet>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ds.inkDark,
  },
  hero: {
    minHeight: HERO_HEIGHT,
    backgroundColor: ds.inkDark,
  },
  heroInner: {
    paddingHorizontal: 24,
    paddingTop: spacing[2],
    paddingBottom: SHEET_OVERLAP + 24,
    gap: spacing[6],
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  wordmarkWrap: {
    alignItems: "flex-start",
  },
  wordmark: {
    color: ds.onDark,
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.5,
  },
  kavWrap: {
    flex: 1,
  },
  sheetContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: ds.ink,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  form: {
    gap: 14,
  },
  passwordWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  hint: {
    color: ds.danger,
    fontSize: 12,
    fontWeight: "500",
    marginTop: -8,
  },
  errorBox: {
    backgroundColor: ds.dangerSoft,
    borderWidth: 1,
    borderColor: `${ds.danger}33`,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    color: ds.danger,
    fontSize: 14,
    fontWeight: "500",
  },
});
