import { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Text, Input, Button } from "../../components/ui";
import { useT } from "../../lib/hooks/useLanguage";
import { authApi } from "../../lib/api/auth";
import { useAuthStore } from "../../lib/store/auth-store";
import { useThemeColors, spacing, radius } from "../../lib/theme";

const AVATARS = [
  { id: "avatar-1", emoji: "😊", bg: "rgba(15,118,110,0.15)" },
  { id: "avatar-2", emoji: "🤩", bg: "rgba(45,109,140,0.2)" },
  { id: "avatar-3", emoji: "🦊", bg: "rgba(153,221,215,0.25)" },
  { id: "avatar-4", emoji: "🐱", bg: "rgba(45,109,140,0.2)" },
  { id: "avatar-5", emoji: "🚀", bg: "rgba(15,118,110,0.1)" },
  { id: "avatar-6", emoji: "🌻", bg: "rgba(45,109,140,0.15)" },
];

export default function RegisterScreen() {
  const t = useT();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const c = useThemeColors();

  const [step, setStep] = useState(1);
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarId, setAvatarId] = useState("avatar-1");

  const registerMutation = useMutation({
    mutationFn: () =>
      authApi.register({ email, password, name, inviteCode, avatarId }),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.replace("/(auth)/onboarding");
    },
  });

  const canGoNext = () => {
    if (step === 1) return inviteCode.trim().length >= 4;
    if (step === 2)
      return (
        name.trim() &&
        email.trim() &&
        password.length >= 6 &&
        password === confirmPassword
      );
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else registerMutation.mutate();
  };

  const passwordStrength =
    password.length >= 8 ? 3 : password.length >= 6 ? 2 : password.length >= 1 ? 1 : 0;

  const strengthColor = (bar: number) => {
    if (passwordStrength >= bar) {
      return passwordStrength >= 3 ? c.success : passwordStrength >= 2 ? c.warning : c.danger;
    }
    return c.borderLight;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          {step > 1 ? (
            <Pressable
              onPress={() => setStep(step - 1)}
              style={[styles.backBtn, { backgroundColor: c.surface }]}
            >
              <Ionicons name="arrow-back" size={20} color={c.text} />
            </Pressable>
          ) : (
            <Link href="/(auth)/login" asChild>
              <Pressable style={[styles.backBtn, { backgroundColor: c.surface }]}>
                <Ionicons name="arrow-back" size={20} color={c.text} />
              </Pressable>
            </Link>
          )}
          <Text variant="h2">{t.auth.register}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressRow}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.progressBar,
                {
                  backgroundColor:
                    s <= step ? c.primaryDark : c.borderLight,
                },
              ]}
            />
          ))}
        </View>

        {/* Step 1: Invite code */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.stepIconWrap}>
              <Ionicons
                name="key-outline"
                size={36}
                color={c.accent}
              />
            </View>
            <Text variant="h2" style={styles.stepTitle}>
              {t.auth.inviteCode}
            </Text>
            <Text variant="bodyLight" style={styles.stepDesc}>
              {t.auth.enterInviteCode}
            </Text>
            <Input
              placeholder="XXXX-XXXX"
              value={inviteCode}
              onChangeText={(v: string) => setInviteCode(v.toUpperCase())}
              maxLength={10}
              autoCapitalize="characters"
              containerStyle={styles.inviteInput}
              style={styles.inviteText}
            />
          </View>
        )}

        {/* Step 2: User details */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Input
              icon="person-outline"
              placeholder={t.auth.name}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Input
              icon="mail-outline"
              placeholder={t.auth.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              containerStyle={{ marginTop: spacing.md }}
            />
            <Input
              icon="lock-closed-outline"
              placeholder={t.auth.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              containerStyle={{ marginTop: spacing.md }}
            />
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map((bar) => (
                    <View
                      key={bar}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: strengthColor(bar) },
                      ]}
                    />
                  ))}
                </View>
                {password.length < 6 && (
                  <Text style={{ fontSize: 10, fontWeight: "500", color: c.danger }}>
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
              containerStyle={{ marginTop: spacing.md }}
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={{ fontSize: 12, fontWeight: "500", color: c.danger, marginTop: 4 }}>
                {t.auth.passwordsDoNotMatch}
              </Text>
            )}
          </View>
        )}

        {/* Step 3: Avatar */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text variant="h2" style={styles.stepTitle}>
              {t.auth.selectAvatar}
            </Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((av) => (
                <Pressable
                  key={av.id}
                  onPress={() => setAvatarId(av.id)}
                  style={[
                    styles.avatarCell,
                    { backgroundColor: av.bg },
                    avatarId === av.id && {
                      borderWidth: 3,
                      borderColor: c.primaryDark,
                    },
                  ]}
                >
                  <Text style={styles.avatarEmoji}>{av.emoji}</Text>
                  {avatarId === av.id && (
                    <View
                      style={[
                        styles.avatarCheck,
                        { backgroundColor: c.primaryDark },
                      ]}
                    >
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom area */}
      <View style={styles.bottom}>
        {registerMutation.isError && (
          <View style={styles.errorBox}>
            <Text style={{ color: c.danger, fontSize: 14, fontWeight: "500" }}>
              {t.common.error}
            </Text>
          </View>
        )}

        <Button
          title={
            registerMutation.isPending
              ? ""
              : step < 3
                ? t.common.next
                : t.common.done
          }
          onPress={handleNext}
          disabled={!canGoNext()}
          loading={registerMutation.isPending}
        />

        {step === 1 && (
          <View style={styles.loginRow}>
            <Text variant="bodyLight">{t.auth.alreadyHaveAccount} </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={{ color: c.primaryDark, fontWeight: "700", fontSize: 14 }}>
                  {t.auth.login}
                </Text>
              </Pressable>
            </Link>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },
  progressBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  stepContent: {
    marginTop: 32,
    gap: 4,
  },
  stepIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(153,221,215,0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  stepTitle: {
    textAlign: "center",
  },
  stepDesc: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  inviteInput: {
    marginTop: 8,
  },
  inviteText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 3,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  strengthBars: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 20,
    justifyContent: "center",
  },
  avatarCell: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 36,
  },
  avatarCheck: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 12,
  },
  errorBox: {
    backgroundColor: "rgba(179, 59, 59, 0.1)",
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
