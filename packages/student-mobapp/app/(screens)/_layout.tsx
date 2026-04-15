import { Stack } from "expo-router";
import { useThemeColors } from "../../lib/theme";
import { useT } from "../../lib/hooks/useLanguage";

export default function ScreensLayout() {
  const c = useThemeColors();
  const t = useT();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.primary,
        headerTitleStyle: { fontFamily: "Nunito-SemiBold", color: c.text },
        headerBackTitle: t.common.back,
      }}
    >
      <Stack.Screen name="journal" options={{ title: t.journal.title }} />
      <Stack.Screen name="plant" options={{ title: t.plant.title }} />
      <Stack.Screen name="achievements" options={{ title: t.achievements.title }} />
      <Stack.Screen name="appointments" options={{ title: t.appointments.title }} />
      <Stack.Screen name="mood-calendar" options={{ title: t.mood.calendar }} />
      <Stack.Screen name="chat-history" options={{ title: t.chat.history }} />
      <Stack.Screen name="chat/[sessionId]" options={{ headerShown: false }} />
      <Stack.Screen name="sos" options={{ title: "SOS" }} />
      <Stack.Screen name="messages/index" options={{ title: t.directChat.title }} />
      <Stack.Screen
        name="messages/[conversationId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="tests/index" options={{ title: t.tests.title }} />
      <Stack.Screen
        name="tests/[testId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="tests/results/[sessionId]"
        options={{ title: t.tests.result }}
      />
      <Stack.Screen name="exercises/breathing" options={{ title: t.exercises.title }} />
      <Stack.Screen name="exercises/grounding" options={{ title: t.exercises.title }} />
      <Stack.Screen name="exercises/pmr" options={{ title: t.exercises.title }} />
      <Stack.Screen name="exercises/thought-diary" options={{ title: t.exercises.title }} />
    </Stack>
  );
}
