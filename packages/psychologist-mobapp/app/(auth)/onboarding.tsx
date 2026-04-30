import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import {
  Body,
  Button,
  Caption,
  Eyebrow,
  H1,
  H3,
  Input,
  Stepper,
  type StepperStep,
  Text,
} from "../../components/ui";
import { useT } from "../../lib/hooks/useLanguage";
import { useAuthStore } from "../../lib/store/auth-store";
import { useThemeColors, radius, spacing } from "../../lib/theme";
import { hapticLight } from "../../lib/haptics";
import { schoolsApi } from "../../lib/api/schools";
import { authApi } from "../../lib/api/auth";
import { officeHoursApi } from "../../lib/api/office-hours";
import { validateIntervals } from "@tirek/shared/office-hours";
import type {
  OfficeHoursDayOfWeek,
  OfficeHoursInterval,
} from "@tirek/shared";

type Step = "welcome" | "school" | "schedule";

const TOTAL_STEPS = 3;
const STEP_INDEX: Record<Exclude<Step, "welcome">, number> = {
  school: 1,
  schedule: 2,
};

const ALL_DAYS: { dow: OfficeHoursDayOfWeek; key: keyof DayLabels }[] = [
  { dow: 1, key: "mon" },
  { dow: 2, key: "tue" },
  { dow: 3, key: "wed" },
  { dow: 4, key: "thu" },
  { dow: 5, key: "fri" },
  { dow: 6, key: "sat" },
  { dow: 7, key: "sun" },
];

interface DayLabels {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

const DEFAULT_WORKDAYS = new Set<OfficeHoursDayOfWeek>([1, 2, 3, 4, 5]);
const DEFAULT_START = "09:00";
const DEFAULT_END = "17:00";

export default function OnboardingScreen() {
  const t = useT();
  const c = useThemeColors();
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const updateUser = useAuthStore((s) => s.updateUser);

  const ob = t.psychologist.onboarding;

  const dayLabels: DayLabels = {
    mon: "Пн",
    tue: "Вт",
    wed: "Ср",
    thu: "Чт",
    fri: "Пт",
    sat: "Сб",
    sun: "Вс",
  };

  const [step, setStep] = useState<Step>("welcome");

  const [schoolName, setSchoolName] = useState("");
  const [schoolCity, setSchoolCity] = useState("");

  const [workdays, setWorkdays] = useState<Set<OfficeHoursDayOfWeek>>(
    new Set(DEFAULT_WORKDAYS),
  );
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [endTime, setEndTime] = useState(DEFAULT_END);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const finishMutation = useMutation({
    mutationFn: async () => {
      const school = await schoolsApi.create({
        name: schoolName.trim(),
        city: schoolCity.trim() || null,
      });
      const user = await authApi.updateProfile({ schoolId: school.id });

      const intervals: OfficeHoursInterval[] = [
        { start: startTime, end: endTime },
      ];
      const selectedDays = Array.from(workdays).sort(
        (a, b) => a - b,
      ) as OfficeHoursDayOfWeek[];
      const allDays: OfficeHoursDayOfWeek[] = [1, 2, 3, 4, 5, 6, 7];
      await Promise.all(
        allDays.map((dow) =>
          officeHoursApi.upsertTemplateDay(
            dow,
            selectedDays.includes(dow) ? intervals : [],
            null,
          ),
        ),
      );

      return user;
    },
    onSuccess: (user) => {
      updateUser({ schoolId: (user as { schoolId?: string | null }).schoolId ?? null });
      completeOnboarding();
      router.replace("/(tabs)");
    },
    onError: () => {
      setSubmitError(ob.wizardErrorGeneric);
    },
  });

  const isSchoolValid = schoolName.trim().length > 0;

  const scheduleError = useMemo(() => {
    if (workdays.size === 0) return ob.wizardScheduleAtLeastOneDay;
    const result = validateIntervals([{ start: startTime, end: endTime }]);
    if (!result.ok) return ob.wizardScheduleInvalidRange;
    return null;
  }, [
    workdays,
    startTime,
    endTime,
    ob.wizardScheduleAtLeastOneDay,
    ob.wizardScheduleInvalidRange,
  ]);

  const isScheduleValid = scheduleError === null;

  function handleStart() {
    hapticLight();
    setStep("school");
  }

  function handleBack() {
    hapticLight();
    setSubmitError(null);
    if (step === "schedule") setStep("school");
    else if (step === "school") setStep("welcome");
  }

  function handleNextFromSchool() {
    if (!isSchoolValid) return;
    hapticLight();
    setStep("schedule");
  }

  function toggleDay(dow: OfficeHoursDayOfWeek) {
    hapticLight();
    setWorkdays((prev) => {
      const next = new Set(prev);
      if (next.has(dow)) next.delete(dow);
      else next.add(dow);
      return next;
    });
  }

  function handleFinish() {
    if (!isScheduleValid || finishMutation.isPending) return;
    setSubmitError(null);
    finishMutation.mutate();
  }

  // ── Welcome ───────────────────────────────────────────────────────
  if (step === "welcome") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.welcomeContent}>
          <View style={[styles.welcomeLogo, { backgroundColor: c.primary }]}>
            <Ionicons name="sparkles" size={36} color="#FFFFFF" />
          </View>

          <H1 style={styles.welcomeTitle}>{ob.wizardWelcomeTitle}</H1>
          <Body style={[styles.welcomeSubtitle, { color: c.textLight }]}>
            {ob.wizardWelcomeSubtitle}
          </Body>

          <View style={styles.welcomeBullets}>
            <WelcomeBullet
              icon="business-outline"
              text={ob.wizardSchoolTitle}
            />
            <WelcomeBullet
              icon="time-outline"
              text={ob.wizardScheduleTitle}
            />
          </View>
        </View>

        <View style={styles.bottomBar}>
          <Button title={ob.wizardWelcomeCta} onPress={handleStart} />
        </View>
      </SafeAreaView>
    );
  }

  // ── School / Schedule shared chrome ──────────────────────────────
  const stepIndex = STEP_INDEX[step];

  const stepperSteps: StepperStep[] = [
    { id: "welcome", label: ob.wizardWelcomeTitle },
    { id: "school", label: ob.wizardSchoolTitle },
    { id: "schedule", label: ob.wizardScheduleTitle },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={[styles.backBtn, { backgroundColor: c.surfaceSecondary }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={18} color={c.text} />
          </Pressable>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.stepperWrap}>
          <Stepper steps={stepperSteps} current={stepIndex} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === "school" ? (
            <>
              <H1 style={styles.stepTitle}>{ob.wizardSchoolTitle}</H1>
              <Body style={[styles.stepSubtitle, { color: c.textLight }]}>
                {ob.wizardSchoolSubtitle}
              </Body>

              <View style={styles.field}>
                <Eyebrow style={[styles.label, { color: c.textLight }]}>
                  {ob.wizardSchoolNameLabel}
                </Eyebrow>
                <Input
                  icon="business-outline"
                  placeholder={ob.wizardSchoolNamePlaceholder}
                  value={schoolName}
                  onChangeText={setSchoolName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <Eyebrow style={[styles.label, { color: c.textLight }]}>
                  {ob.wizardSchoolCityLabel}{" "}
                  <Eyebrow style={{ color: c.textLight, opacity: 0.7 }}>
                    · {ob.wizardSchoolCityOptional}
                  </Eyebrow>
                </Eyebrow>
                <Input
                  icon="location-outline"
                  placeholder={ob.wizardSchoolCityPlaceholder}
                  value={schoolCity}
                  onChangeText={setSchoolCity}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>
            </>
          ) : (
            <>
              <H1 style={styles.stepTitle}>{ob.wizardScheduleTitle}</H1>
              <Body style={[styles.stepSubtitle, { color: c.textLight }]}>
                {ob.wizardScheduleSubtitle}
              </Body>

              <View style={styles.field}>
                <Eyebrow style={[styles.label, { color: c.textLight }]}>
                  {ob.wizardScheduleWorkdays}
                </Eyebrow>
                <View style={styles.daysRow}>
                  {ALL_DAYS.map(({ dow, key }) => {
                    const active = workdays.has(dow);
                    return (
                      <Pressable
                        key={dow}
                        onPress={() => toggleDay(dow)}
                        style={[
                          styles.dayChip,
                          {
                            backgroundColor: active
                              ? c.primary
                              : c.surfaceSecondary,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: active ? "#FFFFFF" : c.text,
                            fontWeight: "700",
                            fontSize: 13,
                          }}
                        >
                          {dayLabels[key]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Eyebrow style={[styles.label, { color: c.textLight }]}>
                  {ob.wizardScheduleHours}
                </Eyebrow>
                <View style={styles.timeRow}>
                  <TimeInput
                    label={ob.wizardScheduleStart}
                    value={startTime}
                    onChange={setStartTime}
                  />
                  <View style={styles.timeDash}>
                    <Text style={{ color: c.textLight, fontSize: 18 }}>—</Text>
                  </View>
                  <TimeInput
                    label={ob.wizardScheduleEnd}
                    value={endTime}
                    onChange={setEndTime}
                  />
                </View>
              </View>

              {scheduleError ? (
                <View
                  style={[
                    styles.hint,
                    { backgroundColor: `${c.danger}14`, borderColor: c.danger },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color={c.danger}
                  />
                  <Body size="sm" style={{ color: c.danger, flex: 1 }}>
                    {scheduleError}
                  </Body>
                </View>
              ) : (
                <View
                  style={[
                    styles.hint,
                    {
                      backgroundColor: `${c.primary}10`,
                      borderColor: `${c.primary}30`,
                    },
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={c.primary}
                  />
                  <Body size="sm" style={{ color: c.text, flex: 1 }}>
                    {ob.wizardScheduleHint}
                  </Body>
                </View>
              )}
            </>
          )}

          {submitError ? (
            <View
              style={[
                styles.hint,
                { backgroundColor: `${c.danger}14`, borderColor: c.danger },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={16} color={c.danger} />
              <Body size="sm" style={{ color: c.danger, flex: 1 }}>
                {submitError}
              </Body>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.bottomBar}>
          {step === "school" ? (
            <Button
              title={t.common.next}
              onPress={handleNextFromSchool}
              disabled={!isSchoolValid}
            />
          ) : (
            <Button
              title={
                finishMutation.isPending ? ob.wizardSaving : ob.wizardFinish
              }
              onPress={handleFinish}
              loading={finishMutation.isPending}
              disabled={!isScheduleValid}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function WelcomeBullet({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.bulletRow}>
      <View
        style={[
          styles.bulletIcon,
          { backgroundColor: `${c.primary}14` },
        ]}
      >
        <Ionicons name={icon} size={18} color={c.primary} />
      </View>
      <H3 style={{ flex: 1 }}>{text}</H3>
    </View>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.timeBox}>
      <Caption style={[styles.timeLabel, { color: c.textLight }]}>
        {label}
      </Caption>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="00:00"
        placeholderTextColor={c.textLight}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        style={[
          styles.timeInput,
          {
            color: c.text,
            backgroundColor: c.surface,
            borderColor: c.borderLight,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Welcome
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
    paddingHorizontal: 16,
  },
  welcomeBullets: {
    width: "100%",
    gap: spacing.md,
    paddingHorizontal: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  bulletIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  // Header / progress
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
  stepperWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },

  // Step content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  stepTitle: {
    marginBottom: 4,
  },
  stepSubtitle: {
    marginBottom: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    marginLeft: 2,
  },

  // Days
  daysRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  dayChip: {
    minWidth: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  // Time
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  timeBox: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    marginLeft: 2,
    textTransform: "uppercase",
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  timeDash: {
    paddingBottom: 14,
  },

  // Hint
  hint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
});
