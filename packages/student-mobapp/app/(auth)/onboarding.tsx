import { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, Button } from "../../components/ui";
import { useT } from "../../lib/hooks/useLanguage";
import { useThemeColors, spacing, radius } from "../../lib/theme";

const icons: Array<keyof typeof Ionicons.glyphMap> = [
  "happy-outline",
  "chatbubble-outline",
  "leaf-outline",
];

const bgColors = [
  "rgba(15,118,110,0.12)",
  "rgba(45,109,140,0.12)",
  "rgba(153,221,215,0.2)",
];

export default function OnboardingScreen() {
  const t = useT();
  const router = useRouter();
  const c = useThemeColors();
  const [current, setCurrent] = useState(0);

  const iconColors = [c.primaryDark, c.secondary, c.accent];

  const steps = [
    { title: t.onboarding.step1Title, desc: t.onboarding.step1Desc },
    { title: t.onboarding.step2Title, desc: t.onboarding.step2Desc },
    { title: t.onboarding.step3Title, desc: t.onboarding.step3Desc },
  ];

  const handleNext = () => {
    if (current < steps.length - 1) {
      setCurrent(current + 1);
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[styles.iconWrap, { backgroundColor: bgColors[current] }]}
        >
          <Ionicons
            name={icons[current]}
            size={56}
            color={iconColors[current]}
          />
        </View>

        {/* Text */}
        <Text variant="h1" style={styles.title}>
          {steps[current].title}
        </Text>
        <Text variant="bodyLight" style={styles.desc}>
          {steps[current].desc}
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {steps.map((_, idx) => (
          <Pressable key={idx} onPress={() => setCurrent(idx)}>
            <View
              style={[
                styles.dot,
                idx === current
                  ? [styles.dotActive, { backgroundColor: c.primaryDark }]
                  : styles.dotInactive,
              ]}
            />
          </Pressable>
        ))}
      </View>

      {/* Button */}
      <View style={styles.bottom}>
        <Button
          title={
            current === steps.length - 1
              ? t.onboarding.getStarted
              : t.common.next
          }
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    textAlign: "center",
  },
  desc: {
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    borderRadius: 5,
  },
  dotActive: {
    width: 28,
    height: 8,
  },
  dotInactive: {
    width: 8,
    height: 8,
    backgroundColor: "#D1D5DB",
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
});
