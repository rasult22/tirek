import { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Text, Input, Button } from "../../components/ui";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { authApi } from "../../lib/api/auth";
import { useAuthStore } from "../../lib/store/auth-store";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import type { Language } from "@tirek/shared";

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
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Language toggle */}
          <View style={styles.langRow}>
            <View
              style={[
                styles.langSwitch,
                { backgroundColor: c.surface, ...shadow(1) },
              ]}
            >
              {(["ru", "kz"] as Language[]).map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={[
                    styles.langBtn,
                    language === lang && { backgroundColor: c.primary },
                  ]}
                >
                  <Text
                    variant="body"
                    style={[
                      { fontWeight: "700", color: c.textLight },
                      language === lang && { color: "#FFFFFF" },
                    ]}
                  >
                    {lang === "ru" ? "RU" : "KZ"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <Text variant="h1" style={styles.appName}>
              {t.common.appName}
            </Text>
            <Text variant="bodyLight" style={styles.subtitle}>
              {t.psychologist.role}
            </Text>
          </View>

          {/* Form */}
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

            {/* Password with eye toggle */}
            <View style={styles.passwordWrap}>
              <Input
                icon="lock-closed-outline"
                placeholder={t.auth.password}
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

            {/* Password strength indicator */}
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
                  <Text
                    style={{
                      color: c.danger,
                      fontSize: 10,
                      fontWeight: "500",
                    }}
                  >
                    {t.auth.passwordTooShort}
                  </Text>
                )}
              </View>
            )}

            {/* Confirm password */}
            <Input
              icon="lock-closed-outline"
              placeholder={t.auth.confirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Password mismatch */}
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text
                style={{
                  color: c.danger,
                  fontSize: 12,
                  fontWeight: "500",
                  marginTop: -8,
                }}
              >
                {t.auth.passwordsDoNotMatch}
              </Text>
            )}

            {/* Error */}
            {registerMutation.isError && (
              <View
                style={[styles.errorBox, { borderColor: `${c.danger}26` }]}
              >
                <Text
                  style={{ color: c.danger, fontSize: 14, fontWeight: "500" }}
                >
                  {t.auth.invalidCredentials}
                </Text>
              </View>
            )}

            <Button
              title={t.auth.register}
              onPress={() => registerMutation.mutate()}
              loading={registerMutation.isPending}
              disabled={!isValid}
            />

            {/* Link to login */}
            <View style={styles.linkRow}>
              <Text variant="small" style={{ color: c.textLight }}>
                {t.auth.alreadyHaveAccount}{" "}
              </Text>
              <Pressable onPress={() => router.replace("/(auth)/login")}>
                <Text
                  style={{
                    color: c.primary,
                    fontWeight: "700",
                    fontSize: 14,
                  }}
                >
                  {t.auth.login}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 32,
  },
  langRow: {
    alignItems: "flex-end",
    paddingTop: spacing.sm,
  },
  langSwitch: {
    flexDirection: "row",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  langBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 28,
  },
  logoImg: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 6,
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
  errorBox: {
    backgroundColor: "rgba(179, 59, 59, 0.08)",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
});
