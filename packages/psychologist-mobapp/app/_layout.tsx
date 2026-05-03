import { useEffect } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import queryClient, { asyncStoragePersister } from "../queries/index";
import { LanguageProvider } from "../lib/hooks/useLanguage";
import { ThemeProvider } from "../lib/theme";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { NetworkStatus } from "../components/NetworkStatus";
import { OnlineManager } from "../lib/offline";
import { checkForUpdate } from "../lib/updates";
import { useNotifications } from "../lib/notifications";

SplashScreen.preventAutoHideAsync().catch(() => {});

const SHEET_OPTIONS = {
  presentation: "formSheet",
  sheetAllowedDetents: "fitToContents",
  sheetGrabberVisible: true,
  sheetCornerRadius: 24,
} as const;

function ThemedApp() {
  useNotifications();

  useEffect(() => {
    checkForUpdate();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <NetworkStatus />
      <OnlineManager />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="generate-codes" options={SHEET_OPTIONS} />
        <Stack.Screen name="help" options={SHEET_OPTIONS} />
        <Stack.Screen name="students-filters" options={SHEET_OPTIONS} />
        <Stack.Screen name="intervals-editor" options={SHEET_OPTIONS} />
        <Stack.Screen name="override-editor" options={SHEET_OPTIONS} />
      </Stack>
    </>
  );
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}

export default RootLayout;
