import { useEffect } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import queryClient, { asyncStoragePersister } from "../queries/index";
import { LanguageProvider } from "../lib/hooks/useLanguage";
import { ThemeProvider, useTheme } from "../lib/theme";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { NetworkStatus } from "../components/NetworkStatus";
import { OnlineManager } from "../lib/offline";
import { initSentry, Sentry } from "../lib/sentry";
import { checkForUpdate } from "../lib/updates";

initSentry();

function ThemedApp() {
  const { isDark } = useTheme();

  useEffect(() => {
    checkForUpdate();
  }, []);

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <NetworkStatus />
      <OnlineManager />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </>
  );
}

function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <LanguageProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <ErrorBoundary>
              <ThemedApp />
            </ErrorBoundary>
          </SafeAreaProvider>
        </ThemeProvider>
      </LanguageProvider>
    </PersistQueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
