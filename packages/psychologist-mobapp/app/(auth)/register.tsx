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

const HERO_HEIGHT = 240;
const SHEET_OVERLAP = 32;

export default function RegisterScreen() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const c = useThemeColors();

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: () =>
      authApi.registerPsychologist({
        email,
        password,
        name: `${lastName.trim()} ${firstName.trim()}`,
      }),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.replace("/");
    },
  });

  const isValid =
    lastName.trim().length > 0 &&
    firstName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

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
              icon="person-outline"
              placeholder={t.auth.lastName}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoComplete="family-name"
            />

            <Input
              icon="person-outline"
              placeholder={t.auth.firstName}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoComplete="given-name"
            />

            <Input
              icon="mail-outline"
              placeholder={t.auth.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View style={styles.passwordWrap}>
              <Input
                icon="lock-closed-outline"
                placeholder={t.auth.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                passwordRules="minlength: 6;"
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

            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          password.length >= 8
                            ? c.success
                            : password.length >= 6
                              ? c.warning
                              : c.danger,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          password.length >= 6
                            ? password.length >= 8
                              ? c.success
                              : c.warning
                            : c.borderLight,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          password.length >= 8 ? c.success : c.borderLight,
                      },
                    ]}
                  />
                </View>
                {password.length < 6 && (
                  <Text style={styles.strengthHint}>
                    {t.auth.passwordTooShort}
                  </Text>
                )}
              </View>
            )}

            <Input
              icon="lock-closed-outline"
              placeholder={t.auth.confirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="off"
              textContentType="oneTimeCode"
            />

            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.mismatchText}>
                {t.auth.passwordsDoNotMatch}
              </Text>
            )}

            {registerMutation.isError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {authErrorMessage(registerMutation.error, t)}
                </Text>
              </View>
            )}

            <Button
              title={t.auth.register}
              onPress={() => registerMutation.mutate()}
              loading={registerMutation.isPending}
              disabled={!isValid}
              size="lg"
            />

            <View style={styles.linkRow}>
              <Body size="sm" style={{ color: c.textLight }}>
                {t.auth.alreadyHaveAccount}{" "}
              </Body>
              <Pressable onPress={() => router.replace("/(auth)/login")}>
                <Text style={styles.linkText}>{t.auth.login}</Text>
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
    gap: spacing[8],
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
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -1.5,
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
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -6,
  },
  strengthBars: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  strengthHint: {
    color: ds.danger,
    fontSize: 10,
    fontWeight: "500",
  },
  mismatchText: {
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
