import { Stack } from "expo-router";
import { useThemeColors } from "../../lib/theme";

export default function ScreensLayout() {
  const c = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.primary,
        headerTitleStyle: { fontFamily: "Nunito-SemiBold", color: c.text },
        headerBackTitle: "Назад",
      }}
    />
  );
}
