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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Text, Input, Button, Sheet, Body } from "../../components/ui";
import { colors as ds, radius, spacing } from "@tirek/shared/design-system";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { authApi } from "../../lib/api/auth";
import { authErrorMessage } from "../../lib/api/errors";
import { useAuthStore } from "../../lib/store/auth-store";
import { useThemeColors } from "../../lib/theme";
import type { Language } from "@tirek/shared";

const HERO_HEIGHT = 280;
const SHEET_OVERLAP = 32;

export default function LoginScreen() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const c = useThemeColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleError, setRoleError] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (data) => {
      if (data.user.role !== "psychologist" && data.user.role !== "admin") {
        setRoleError(true);
        return;
      }
      setRoleError(false);
      setAuth(data.token, data.user);
      // Куда вести (онбординг vs (tabs)) — решает app/index.tsx по user.onboardingCompleted.
      router.replace("/");
    },
    onMutate: () => {
      setRoleError(false);
    },
  });

  const hasError = loginMutation.isError || roleError;
  const errorMessage = roleError
    ? t.auth.invalidCredentials
    : authErrorMessage(loginMutation.error, t);

  return (
    <View style={styles.root}>
      {/* Hero */}
      <SafeAreaView style={styles.hero} edges={["top"]}>
        <View style={styles.heroInner}>
          <View style={styles.langRow}>
            <View style={styles.langSwitch}>
              {(["ru", "kz"] as Language[]).map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={[
                    styles.langBtn,
                    language === lang && styles.langBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langText,
                      language === lang && styles.langTextActive,
                    ]}
                  >
                    {lang === "ru" ? "RU" : "KZ"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.wordmarkWrap}>
            <Text style={styles.wordmark}>tirek.</Text>
            <Text style={styles.wordmarkSub}>{t.psychologist.role}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Sheet */}
      <KeyboardAvoidingView
        style={styles.kavWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Sheet variant="over-hero" overlap={SHEET_OVERLAP}>
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.form}>
              <Input
                icon="mail-outline"
                placeholder={t.auth.email}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={hasError}
              />

              <View style={styles.passwordWrap}>
                <Input
                  icon="lock-closed-outline"
                  placeholder={t.auth.password}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  error={hasError}
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

              <View style={styles.forgotRow}>
                <Pressable
                  onPress={() => router.push("/(auth)/forgot-password")}
                  hitSlop={8}
                >
                  <Text style={styles.forgotLink}>{t.auth.forgotPassword}</Text>
                </Pressable>
              </View>

              {hasError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <Button
                title={t.auth.login}
                onPress={() => loginMutation.mutate()}
                loading={loginMutation.isPending}
                disabled={!email.trim() || !password.trim()}
                size="lg"
              />

              <View style={styles.linkRow}>
                <Body size="sm" style={{ color: c.textLight }}>
                  {t.auth.noAccount}{" "}
                </Body>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Text style={styles.linkText}>{t.auth.register}</Text>
                </Pressable>
              </View>
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
    gap: spacing[10],
  },
  langRow: {
    alignItems: "flex-end",
  },
  langSwitch: {
    flexDirection: "row",
    backgroundColor: ds.onDarkLine,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  langBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  langBtnActive: {
    backgroundColor: ds.brand,
  },
  langText: {
    fontWeight: "700",
    fontSize: 14,
    color: ds.onDarkMute,
  },
  langTextActive: {
    color: ds.onDark,
  },
  wordmarkWrap: {
    alignItems: "flex-start",
  },
  wordmark: {
    color: ds.onDark,
    fontFamily: "Inter_700Bold",
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -2,
  },
  wordmarkSub: {
    color: ds.onDarkMute,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    marginTop: 4,
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
  forgotRow: {
    alignItems: "flex-end",
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: "600",
    color: ds.brand,
  },
  errorBox: {
    backgroundColor: ds.dangerSoft,
    borderWidth: 1,
    borderColor: `${ds.danger}33`,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  errorText: {
    color: ds.danger,
    fontSize: 14,
    fontWeight: "500",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  linkText: {
    color: ds.brand,
    fontWeight: "700",
    fontSize: 14,
  },
});
