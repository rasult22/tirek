export const lightColors = {
  primary: "#0F766E",
  primaryDark: "#0A5C56",
  secondary: "#2D6D8C",
  accent: "#99DDD7",
  info: "#2D6D8C",
  success: "#16794A",
  warning: "#8C6308",
  danger: "#B33B3B",
  bg: "#F8FAFB",
  text: "#1A2E2E",
  textLight: "#3D5553",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F5F5",
  surfaceHover: "#E8EEEE",
  border: "#D4DEDE",
  borderLight: "#E4EAEA",
  inputBorder: "#B8C8C6",
  streakOrange: "#EA580C",
  streakOrangeBg: "rgba(251,191,36,0.15)",
  achieveGold: "#CA8A04",
  achieveGoldDark: "#A16207",
  appointmentPurple: "#6D28D9",
  appointmentPurpleBg: "rgba(139,92,246,0.12)",
  plantGreen: "#10B981",
  plantGreenBg: "rgba(16,185,129,0.12)",
} as const;

export const darkColors = {
  primary: "#14B8A6",
  primaryDark: "#2DD4BF",
  secondary: "#38BDF8",
  accent: "#0D4A45",
  info: "#38BDF8",
  success: "#22C55E",
  warning: "#FACC15",
  danger: "#EF4444",
  bg: "#0F1419",
  text: "#E8EDED",
  textLight: "#94A3A3",
  surface: "#1A2328",
  surfaceSecondary: "#212D33",
  surfaceHover: "#2A3840",
  border: "#2A3840",
  borderLight: "#1F2D34",
  inputBorder: "#3A4D55",
  streakOrange: "#FB923C",
  streakOrangeBg: "rgba(251,191,36,0.2)",
  achieveGold: "#EAB308",
  achieveGoldDark: "#CA8A04",
  appointmentPurple: "#A78BFA",
  appointmentPurpleBg: "rgba(139,92,246,0.2)",
  plantGreen: "#34D399",
  plantGreenBg: "rgba(16,185,129,0.2)",
} as const;

export type ThemeColors = {
  [K in keyof typeof lightColors]: string;
};

/** @deprecated Use useThemeColors() hook instead */
export const colors = lightColors;
