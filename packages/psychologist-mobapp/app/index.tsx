import { useEffect } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../lib/store/auth-store";
import { useThemeColors } from "../lib/theme";
import { authApi } from "../lib/api/auth";

export default function Index() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const updateUser = useAuthStore((s) => s.updateUser);
  const c = useThemeColors();

  // Issue #112: тянем свежий /me на старте — локальный персист мог быть
  // записан до появления флага onboardingCompleted, поэтому source-of-truth
  // принимается с сервера. На время загрузки показываем спиннер, чтобы не мигать.
  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    enabled: hydrated && !!token,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (meQuery.data) updateUser(meQuery.data);
  }, [meQuery.data, updateUser]);

  if (!hydrated || (token && meQuery.isLoading)) {
    return (
      <View style={[styles.loading, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (token) {
    const onboardingCompleted =
      meQuery.data?.onboardingCompleted ?? user?.onboardingCompleted === true;
    if (!onboardingCompleted) {
      return <Redirect href="/(auth)/onboarding" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
