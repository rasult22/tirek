import { useState, useCallback, type ComponentProps } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { useT } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { useThemeColors, spacing, radius } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface StepStyle {
  icon: IoniconsName;
  color: string;
}

const STEP_STYLES: StepStyle[] = [
  { icon: "grid",          color: "#14B8A6" },
  { icon: "people",        color: "#3B82F6" },
  { icon: "alert-circle",  color: "#EF4444" },
  { icon: "chatbubbles",   color: "#8B5CF6" },
  { icon: "clipboard",     color: "#F59E0B" },
  { icon: "calendar",      color: "#10B981" },
  { icon: "key",           color: "#EC4899" },
  { icon: "bar-chart",     color: "#6366F1" },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OnboardingScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const [currentStep, setCurrentStep] = useState(-1);

  const ob = t.psychologist.onboarding;

  const steps = [
    { title: ob.step1Title, desc: ob.step1Desc },
    { title: ob.step2Title, desc: ob.step2Desc },
    { title: ob.step3Title, desc: ob.step3Desc },
    { title: ob.step4Title, desc: ob.step4Desc },
    { title: ob.step5Title, desc: ob.step5Desc },
    { title: ob.step6Title, desc: ob.step6Desc },
    { title: ob.step7Title, desc: ob.step7Desc },
    { title: ob.step8Title, desc: ob.step8Desc },
  ];

  const totalSteps = steps.length;
  const isWelcome = currentStep === -1;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = useCallback(() => {
    hapticLight();
    if (isLastStep) {
      completeOnboarding();
      router.replace("/(tabs)");
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLastStep, completeOnboarding, router]);

  const handleBack = useCallback(() => {
    hapticLight();
    setCurrentStep((s) => Math.max(-1, s - 1));
  }, []);

  const handleSkip = useCallback(() => {
    hapticLight();
    completeOnboarding();
    router.replace("/(tabs)");
  }, [completeOnboarding, router]);

  // ── WELCOME SCREEN ──
  if (isWelcome) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.welcomeContent}>
          {/* Logo */}
          <View
            style={[styles.welcomeLogo, { backgroundColor: STEP_STYLES[0].color }]}
          >
            <Ionicons name="sparkles" size={36} color="#FFFFFF" />
          </View>

          {/* Title */}
          <Text variant="h1" style={styles.welcomeTitle}>
            {ob.welcome}
          </Text>
          <Text variant="bodyLight" style={styles.welcomeSubtitle}>
            {ob.welcomeSubtitle}
          </Text>

          {/* Feature grid */}
          <View style={styles.grid}>
            {STEP_STYLES.map((style, i) => (
              <View key={i} style={styles.gridItem}>
                <View
                  style={[styles.gridIcon, { backgroundColor: style.color }]}
                >
                  <Ionicons name={style.icon} size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.gridLabel, { color: c.textLight }]}>
                  {steps[i].title}
                </Text>
              </View>
            ))}
          </View>

          {/* Start button */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: c.primary },
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>{t.common.next}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>

          {/* Skip */}
          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: c.textLight }]}>
              {ob.skip}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── STEP SCREENS ──
  const style = STEP_STYLES[currentStep];
  const step = steps[currentStep];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: c.surfaceSecondary }]}
        >
          <Ionicons name="arrow-back" size={16} color={c.text} />
        </Pressable>

        <Text
          variant="body"
          style={{ fontWeight: "700", color: c.textLight }}
        >
          {currentStep + 1} {ob.stepOf} {totalSteps}
        </Text>

        <Pressable onPress={handleSkip} hitSlop={8}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: c.textLight }}>
            {ob.skip}
          </Text>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: c.surfaceSecondary },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: style.color,
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.stepContent}>
        <View style={[styles.stepIcon, { backgroundColor: style.color }]}>
          <Ionicons name={style.icon} size={48} color="#FFFFFF" />
        </View>

        <Text variant="h1" style={styles.stepTitle}>
          {step.title}
        </Text>
        <Text variant="bodyLight" style={styles.stepDesc}>
          {step.desc}
        </Text>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Dots */}
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                hapticLight();
                setCurrentStep(i);
              }}
              hitSlop={4}
            >
              <View
                style={[
                  styles.dot,
                  i === currentStep
                    ? { width: 24, backgroundColor: style.color }
                    : i < currentStep
                      ? { width: 6, backgroundColor: `${c.textLight}50` }
                      : { width: 6, backgroundColor: `${c.textLight}25` },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* Next / Finish button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: style.color },
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {isLastStep ? ob.letsStart : t.common.next}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Welcome ──
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  welcomeLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },

  // ── Grid ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 32,
    width: "100%",
  },
  gridItem: {
    width: "25%",
    alignItems: "center",
    marginBottom: 16,
  },
  gridIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
    paddingHorizontal: 2,
  },

  // ── Buttons ──
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 16,
    borderRadius: radius.lg,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  skipBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Progress ──
  progressWrap: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },

  // ── Step content ──
  stepContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  stepIcon: {
    width: 112,
    height: 112,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  stepTitle: {
    textAlign: "center",
    marginBottom: 12,
  },
  stepDesc: {
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },

  // ── Bottom ──
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
