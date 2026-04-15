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
        headerTitleStyle: { fontFamily: "DMSans-SemiBold", color: c.text },
        headerBackTitle: t.common.back,
        animation: "slide_from_right",
      }}
    />
  );
}
