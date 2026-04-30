import { Stack } from "expo-router";

/**
 * Inner stack within the modal group.
 * The formSheet presentation is configured on the parent Stack
 * (app/_layout.tsx → Stack.Screen name="(modals)"), so this child
 * stack just renders screens flat.
 */
export default function ModalsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
