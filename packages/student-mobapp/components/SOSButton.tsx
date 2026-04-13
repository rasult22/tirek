import { StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../lib/theme";
import { shadow } from "../lib/theme/shadows";
import { hapticHeavy } from "../lib/haptics";

export function SOSButton() {
  const router = useRouter();
  const c = useThemeColors();

  return (
    <Pressable
      onPress={() => { hapticHeavy(); router.push("/(screens)/sos"); }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: c.danger, ...shadow(3) },
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
      accessibilityLabel="SOS"
    >
      <Ionicons name="shield" size={26} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 90,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
});
