import { Platform, type ViewStyle } from "react-native";

export function shadow(elevation: 1 | 2 | 3): ViewStyle {
  if (Platform.OS === "android") {
    return { elevation };
  }

  const configs = {
    1: { shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
    2: { shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    3: { shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  };

  return {
    shadowColor: "#1A2E2E",
    ...configs[elevation],
  };
}
