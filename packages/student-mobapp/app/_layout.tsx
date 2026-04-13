import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import queryClient, { asyncStoragePersister } from "../queries/index";
import { LanguageProvider } from "../lib/hooks/useLanguage";
import { ThemeProvider, useTheme } from "../lib/theme";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { NetworkStatus } from "../components/NetworkStatus";
import { useNotifications } from "../lib/notifications";
import { OnlineManager } from "../lib/offline";

function NotificationHandler() {
  useNotifications();
  return null;
}

function ThemedApp() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <NetworkStatus />
      <NotificationHandler />
      <OnlineManager />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
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
