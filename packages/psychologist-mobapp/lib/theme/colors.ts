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
  bg: "#0F1117",
  text: "#E2E8F0",
  textLight: "#94A3B8",
  surface: "#1A1D27",
  surfaceSecondary: "#1E2230",
  surfaceHover: "#252A3A",
  border: "#2A3040",
  borderLight: "#1E2530",
  inputBorder: "#3A4560",
} as const;

export type ThemeColors = {
  [K in keyof typeof lightColors]: string;
};

/** @deprecated Use useThemeColors() hook instead */
export const colors = lightColors;
