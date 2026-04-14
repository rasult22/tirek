import { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Text, Input, Button } from "../../components/ui";
import { useT, useLanguage } from "../../lib/hooks/useLanguage";
import { authApi } from "../../lib/api/auth";
import { useAuthStore } from "../../lib/store/auth-store";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import type { Language } from "@tirek/shared";

export default function LoginScreen() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const c = useThemeColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.replace("/(tabs)");
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
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
            {t.onboarding.welcomeDesc}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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

          <Text variant="small" style={styles.forgot}>
            {t.auth.forgotPassword}
          </Text>

          {loginMutation.isError && (
            <View style={[styles.errorBox, { borderColor: `${c.danger}26` }]}>
              <Text style={{ color: c.danger, fontSize: 14, fontWeight: "500" }}>
                {t.auth.invalidCredentials}
              </Text>
            </View>
          )}

          <Button
            title={t.auth.login}
            onPress={() => loginMutation.mutate()}
            loading={loginMutation.isPending}
            disabled={!email.trim() || !password.trim()}
          />
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text variant="bodyLight">{t.auth.noAccount} </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={{ color: c.primaryDark, fontWeight: "700", fontSize: 14 }}>
                {t.auth.register}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
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
    marginTop: 40,
    marginBottom: 32,
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
  forgot: {
    textAlign: "right",
    opacity: 0.6,
  },
  errorBox: {
    backgroundColor: "rgba(179, 59, 59, 0.08)",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 24,
  },
});
