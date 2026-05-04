import { useEffect, useRef, useState } from "react";
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
import { useThemeColors } from "../../lib/theme";

const HERO_HEIGHT = 200;
const SHEET_OVERLAP = 32;
const RESEND_COOLDOWN_SEC = 60;

export default function VerifyCodeScreen() {
  const t = useT();
  const router = useRouter();
  const c = useThemeColors();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? "").trim();

  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyResetCode({ email, code }),
    onSuccess: () => {
      router.push({
        pathname: "/(auth)/new-password",
        params: { email, code },
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.forgotPassword({ email }),
    onSuccess: () => {
      setCooldown(RESEND_COOLDOWN_SEC);
      setCode("");
    },
  });

  const onChangeCode = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setCode(digits);
  };

  const isApiError =
    verifyMutation.isError && verifyMutation.error instanceof ApiError;
  const verifyErrorMessage = isApiError
    ? t.auth.invalidCode
    : t.auth.connectionError;

  const isResendApiError =
    resendMutation.isError && resendMutation.error instanceof ApiError;
  const isResendRateLimit =
    isResendApiError && (resendMutation.error as ApiError).status === 429;
  const resendErrorMessage = isResendRateLimit
    ? t.auth.tooManyCodeRequests
    : isResendApiError
      ? t.auth.invalidCode
      : t.auth.connectionError;

  const canResend = cooldown === 0 && !resendMutation.isPending;

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
            <Text style={styles.title}>{t.auth.verifyCodeTitle}</Text>
            <Text style={[styles.desc, { color: c.textLight }]}>
              {t.auth.verifyCodeDesc}{" "}
              <Text style={styles.descEmail}>{email}</Text>
            </Text>

            <View style={styles.form}>
              <Input
                icon="key-outline"
                placeholder={t.auth.codePlaceholder}
                value={code}
                onChangeText={onChangeCode}
                keyboardType="number-pad"
                maxLength={4}
                autoComplete="one-time-code"
                error={verifyMutation.isError}
              />

              {verifyMutation.isError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{verifyErrorMessage}</Text>
                </View>
              )}

              {resendMutation.isError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{resendErrorMessage}</Text>
                </View>
              )}

              <Button
                title={t.auth.confirmCode}
                onPress={() => verifyMutation.mutate()}
                loading={verifyMutation.isPending}
                disabled={code.length !== 4}
                size="lg"
              />

              <View style={styles.resendRow}>
                {canResend ? (
                  <Pressable
                    onPress={() => resendMutation.mutate()}
                    hitSlop={8}
                  >
                    <Text style={styles.resendActive}>
                      {t.auth.requestNewCode}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.resendInactive, { color: c.textLight }]}>
                    {t.auth.requestNewCodeIn} {cooldown} {t.auth.seconds}
                  </Text>
                )}
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
  descEmail: {
    fontWeight: "700",
    color: ds.ink,
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
  resendRow: {
    alignItems: "center",
    marginTop: 4,
  },
  resendActive: {
    color: ds.brand,
    fontWeight: "700",
    fontSize: 14,
  },
  resendInactive: {
    fontSize: 13,
  },
});
