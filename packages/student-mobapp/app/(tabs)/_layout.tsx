import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../../lib/theme";
import type { ComponentProps } from "react";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const tabs: TabConfig[] = [
  { name: "index", title: "Главная", icon: "home-outline", iconFocused: "home" },
  { name: "chat", title: "Чат", icon: "chatbubble-outline", iconFocused: "chatbubble" },
  { name: "exercises", title: "Практики", icon: "leaf-outline", iconFocused: "leaf" },
  { name: "mood", title: "Настроение", icon: "happy-outline", iconFocused: "happy" },
  { name: "profile", title: "Профиль", icon: "person-outline", iconFocused: "person" },
];

export default function TabsLayout() {
  const c = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textLight,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.borderLight,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontFamily: "Nunito-SemiBold",
          fontSize: 11,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
