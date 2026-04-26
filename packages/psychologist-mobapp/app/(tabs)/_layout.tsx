import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "../../lib/theme";
import { useT } from "../../lib/hooks/useLanguage";
import { crisisApi } from "../../lib/api/crisis";
import { directChatApi } from "../../lib/api/direct-chat";
import type { ComponentProps } from "react";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface TabConfig {
  name: string;
  titleKey: "dashboard" | "students" | "messages" | "crisis" | "more";
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const tabConfigs: TabConfig[] = [
  { name: "index", titleKey: "dashboard", icon: "grid-outline", iconFocused: "grid" },
  { name: "students", titleKey: "students", icon: "people-outline", iconFocused: "people" },
  { name: "messages", titleKey: "messages", icon: "chatbubbles-outline", iconFocused: "chatbubbles" },
  { name: "crisis", titleKey: "crisis", icon: "alert-circle-outline", iconFocused: "alert-circle" },
  { name: "more", titleKey: "more", icon: "ellipsis-horizontal-outline", iconFocused: "ellipsis-horizontal" },
];

export default function TabsLayout() {
  const c = useThemeColors();
  const t = useT();
  const insets = useSafeAreaInsets();

  const { data: counts } = useQuery({
    queryKey: ["crisis", "counts"],
    queryFn: crisisApi.getCounts,
    refetchInterval: 30_000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["direct-chat", "unread-count"],
    queryFn: directChatApi.unreadCount,
    refetchInterval: 30_000,
  });

  const alertCount = counts?.red ?? 0;
  const unreadCount = unreadData?.count ?? 0;

  const titleMap: Record<string, string> = {
    dashboard: t.psychologist.dashboard,
    students: t.psychologist.students,
    messages: t.psychologist.messages,
    crisis: t.psychologist.crisis,
    more: t.common.more,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textLight,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.borderLight,
          paddingBottom: Math.max(insets.bottom, 4),
          height: 56 + Math.max(insets.bottom - 4, 0),
        },
        tabBarLabelStyle: {
          fontFamily: "DMSans-SemiBold",
          fontSize: 11,
        },
      }}
    >
      {tabConfigs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: titleMap[tab.titleKey] ?? tab.titleKey,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
            ...(tab.name === "crisis" && alertCount > 0
              ? {
                  tabBarBadge: alertCount,
                  tabBarBadgeStyle: {
                    backgroundColor: c.danger,
                    fontSize: 10,
                    fontWeight: "700" as const,
                    minWidth: 18,
                    height: 18,
                    lineHeight: 17,
                  },
                }
              : {}),
            ...(tab.name === "messages" && unreadCount > 0
              ? {
                  tabBarBadge: unreadCount,
                  tabBarBadgeStyle: {
                    backgroundColor: c.primary,
                    fontSize: 10,
                    fontWeight: "700" as const,
                    minWidth: 18,
                    height: 18,
                    lineHeight: 17,
                  },
                }
              : {}),
          }}
        />
      ))}
    </Tabs>
  );
}
