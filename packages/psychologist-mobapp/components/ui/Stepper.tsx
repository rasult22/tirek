import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { useThemeColors } from "../../lib/theme";

export interface StepperStep {
  id: string;
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** Index of the active step (0-based). */
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  const c = useThemeColors();

  return (
    <View style={styles.row}>
      {steps.map((step, idx) => {
        const isDone = idx < current;
        const isActive = idx === current;
        const circleBg = isDone ? c.primary : c.surface;
        const circleBorder = isDone || isActive ? c.primary : c.border;
        const numberColor = isDone ? "#FFFFFF" : isActive ? c.primary : c.textLight;
        const labelColor = isActive ? c.text : c.textLight;
        const lineColor = isDone ? c.primary : c.border;

        return (
          <View
            key={step.id}
            style={[
              styles.stepWrap,
              idx < steps.length - 1 && { flex: 1 },
            ]}
          >
            <View style={styles.itemColumn}>
              <View
                style={[
                  styles.circle,
                  { backgroundColor: circleBg, borderColor: circleBorder },
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[styles.number, { color: numberColor }]}
                  >
                    {idx + 1}
                  </Text>
                )}
              </View>
              <Text
                variant="caption"
                style={[styles.label, { color: labelColor }]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
            {idx < steps.length - 1 && (
              <View
                style={[styles.line, { backgroundColor: lineColor }]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  stepWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemColumn: {
    alignItems: "center",
    width: 80,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    fontSize: 12,
    fontWeight: "700",
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  line: {
    flex: 1,
    height: 1,
    marginTop: 14,
    marginHorizontal: 2,
  },
});
