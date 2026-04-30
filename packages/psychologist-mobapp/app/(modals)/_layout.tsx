import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "formSheet",
        headerShown: false,
        sheetAllowedDetents: [0.5, 0.95],
        sheetGrabberVisible: true,
        sheetCornerRadius: 24,
      }}
    />
  );
}
