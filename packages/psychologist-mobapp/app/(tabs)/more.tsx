import { View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { useT } from "../../lib/hooks/useLanguage";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { shadow } from "../../lib/theme/shadows";
import { hapticLight } from "../../lib/haptics";
import type { ComponentProps } from "react";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface MenuItem {
  icon: IoniconsName;
  labelKey: string;
  route?: string;
}

const menuItems: MenuItem[] = [
  { icon: "clipboard-outline", labelKey: "diagnostics", route: "/(screens)/diagnostics" },
  { icon: "calendar-outline", labelKey: "officeHours", route: "/(screens)/office-hours" },
  { icon: "key-outline", labelKey: "inviteCodes", route: "/(screens)/invite-codes" },
  { icon: "bar-chart-outline", labelKey: "analytics", route: "/(screens)/analytics" },
  { icon: "person-outline", labelKey: "profile", route: "/(screens)/profile" },
  { icon: "notifications-outline", labelKey: "notifications", route: "/(screens)/notifications" },
];

export default function MoreScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();

  const labels: Record<string, string> = {
    diagnostics: t.psychologist.diagnostics,
    officeHours: t.psychologist.officeHours,
    inviteCodes: t.psychologist.inviteCodes,
    analytics: t.psychologist.analytics,
    profile: t.nav.profile,
    notifications: t.nav.notifications,
  };

  const handlePress = (item: MenuItem) => {
    hapticLight();
    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.bg }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text variant="h1">{t.common.more}</Text>
      </View>
      <View style={styles.grid}>
        {menuItems.map((item) => (
          <Pressable
            key={item.labelKey}
            onPress={() => handlePress(item)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: c.surface,
                borderColor: c.borderLight,
              },
              shadow(1),
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: c.surfaceSecondary },
              ]}
            >
              <Ionicons name={item.icon} size={24} color={c.primary} />
            </View>
            <Text variant="h3" style={styles.label}>
              {labels[item.labelKey] ?? item.labelKey}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: "47%",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: "center",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    marginBottom: 2,
    textAlign: "center",
  },
});
