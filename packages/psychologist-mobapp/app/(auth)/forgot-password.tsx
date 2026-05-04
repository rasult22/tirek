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
import { Text, Input, Button, Sheet } from "../../components/ui";
import { colors as ds, radius, spacing } from "@tirek/shared/design-system";
import { useT } from "../../lib/hooks/useLanguage";
import { authApi } from "../../lib/api/auth";
import { ApiError } from "../../lib/api/client";
import { useThemeColors } from "../../lib/theme";

const HERO_HEIGHT = 200;
const SHEET_OVERLAP = 32;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const t = useT();
  const router = useRouter();
  const c = useThemeColors();

  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authApi.forgotPassword({ email: email.trim() }),
    onSuccess: () => {
      router.push({
        pathname: "/(auth)/verify-code",
        params: { email: email.trim() },
      });
    },
  });

  const onSubmit = () => {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    mutation.mutate();
  };

  const isApiError = mutation.isError && mutation.error instanceof ApiError;
  const isRateLimit =
    isApiError && (mutation.error as ApiError).status === 429;
  const errorMessage = validationError
    ? t.auth.invalidEmail
    : isRateLimit
      ? t.auth.tooManyCodeRequests
      : isApiError
        ? t.auth.invalidEmail
        : t.auth.connectionError;
  const showError = validationError || mutation.isError;

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
            <Text style={styles.title}>{t.auth.forgotPasswordTitle}</Text>
            <Text style={[styles.desc, { color: c.textLight }]}>
              {t.auth.forgotPasswordDesc}
            </Text>

            <View style={styles.form}>
              <Input
                icon="mail-outline"
                placeholder={t.auth.email}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (validationError) setValidationError(false);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={showError}
              />

              {showError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <Button
                title={t.auth.sendCode}
                onPress={onSubmit}
                loading={mutation.isPending}
                disabled={!email.trim()}
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
