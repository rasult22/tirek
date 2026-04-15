import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Text } from "../../components/ui";
import { SOSButton } from "../../components/SOSButton";
import { useThemeColors } from "../../lib/theme";
import { useDirectChatUnread } from "../../lib/hooks/useDirectChatUnread";
import { testsApi } from "../../lib/api/tests";
import type { ComponentProps } from "react";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
  badgeKey?: "messages" | "tests";
}

const tabs: TabConfig[] = [
  { name: "index", title: "Главная", icon: "home-outline", iconFocused: "home" },
  { name: "chat", title: "Чат", icon: "chatbubble-outline", iconFocused: "chatbubble" },
  { name: "diagnostics", title: "Тесты", icon: "clipboard-outline", iconFocused: "clipboard", badgeKey: "tests" },
  { name: "messages", title: "Сообщения", icon: "mail-outline", iconFocused: "mail", badgeKey: "messages" },
  { name: "profile", title: "Профиль", icon: "person-outline", iconFocused: "person" },
];

export default function TabsLayout() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const unreadCount = useDirectChatUnread();

  const { data: assigned = [] } = useQuery({
    queryKey: ["tests", "assigned"],
    queryFn: () => testsApi.assigned(),
    refetchInterval: 60_000,
  });
  const pendingTestsCount = assigned.filter((a) => a.status !== "completed").length;

  const badgeCounts: Record<string, number> = {
    messages: unreadCount,
    tests: pendingTestsCount,
  };

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textLight,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.borderLight,
          paddingBottom: insets.bottom,
          height: 52 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: "Nunito-SemiBold",
          fontSize: 11,
        },
      }}
    >
      {tabs.map((tab) => {
        const count = tab.badgeKey ? badgeCounts[tab.badgeKey] ?? 0 : 0;
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused, color, size }) => (
                <View>
                  <Ionicons
                    name={focused ? tab.iconFocused : tab.icon}
                    size={size}
                    color={color}
                  />
                  {count > 0 && (
                    <View style={[styles.badge, { backgroundColor: c.danger }]}>
                      <Text style={styles.badgeText}>
                        {count > 9 ? "9+" : count}
                      </Text>
                    </View>
                  )}
                </View>
              ),
            }}
          />
        );
      })}
      <Tabs.Screen name="exercises" options={{ href: null }} />
      <Tabs.Screen name="mood" options={{ href: null }} />
    </Tabs>
    <SOSButton />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
