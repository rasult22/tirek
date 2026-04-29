export const colors = {
  brand: "#0F766E",
  brandSoft: "rgba(15, 118, 110, 0.12)",
  brandDeep: "#0A5C56",
  brandFg: "#FFFFFF",

  bg: "#F5F5F5",
  surface: "#FFFFFF",
  surface2: "#F7F7FA",
  ink: "#0A0A0A",
  inkMuted: "#595D62",
  hairline: "#E2E2E2",
  hover: "rgba(0, 0, 0, 0.04)",

  inkDark: "#0F0E1A",
  inkDarker: "#0B0B0B",
  onDark: "#FFFFFF",
  onDarkMute: "rgba(255, 255, 255, 0.65)",
  onDarkLine: "rgba(255, 255, 255, 0.10)",

  success: "#16794A",
  successSoft: "rgba(22, 121, 74, 0.10)",
  warning: "#FFB319",
  warningSoft: "rgba(255, 179, 25, 0.10)",
  danger: "#FF4E64",
  dangerSoft: "rgba(255, 78, 100, 0.08)",
  info: "#8ACFDE",
  infoSoft: "rgba(138, 207, 222, 0.10)",
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const screenPad = {
  x: 24,
  top: 60,
  bottom: 40,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  "2xl": 20,
  "3xl": 32,
  pill: 9999,
} as const;

export const fontFamily = {
  ui: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  paragraph: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const fontSize = {
  "2xs": 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 48,
  "5xl": 64,
} as const;

export const lineHeight = {
  "2xs": 14,
  xs: 16,
  sm: 20,
  md: 24,
  lg: 24,
  xl: 28,
  "2xl": 32,
  "3xl": 40,
  "4xl": 56,
  "5xl": 72,
} as const;

export const letterSpacing = {
  tight: -1,
  tighter: -1.5,
  display: -2.5,
  eyebrow: 1.5,
} as const;

export const textStyle = {
  display: { size: fontSize["5xl"], lineHeight: lineHeight["5xl"], weight: fontWeight.bold, letterSpacing: letterSpacing.display },
  h1: { size: fontSize["4xl"], lineHeight: lineHeight["4xl"], weight: fontWeight.bold, letterSpacing: letterSpacing.tighter },
  h2: { size: fontSize["3xl"], lineHeight: lineHeight["3xl"], weight: fontWeight.bold, letterSpacing: letterSpacing.tight },
  h3: { size: fontSize["2xl"], lineHeight: lineHeight["2xl"], weight: fontWeight.bold, letterSpacing: 0 },
  h4: { size: fontSize.xl, lineHeight: lineHeight.xl, weight: fontWeight.bold, letterSpacing: 0 },
  bodyMd: { size: fontSize.md, lineHeight: lineHeight.md, weight: fontWeight.regular, letterSpacing: 0 },
  bodySm: { size: fontSize.sm, lineHeight: lineHeight.sm, weight: fontWeight.regular, letterSpacing: 0 },
  bodyXs: { size: fontSize.xs, lineHeight: lineHeight.xs, weight: fontWeight.regular, letterSpacing: 0 },
  caption: { size: fontSize.xs, lineHeight: lineHeight.xs, weight: fontWeight.regular, letterSpacing: 0 },
  eyebrow: { size: fontSize.xs, lineHeight: lineHeight.xs, weight: fontWeight.bold, letterSpacing: letterSpacing.eyebrow },
  label: { size: fontSize.xs, lineHeight: lineHeight.xs, weight: fontWeight.semibold, letterSpacing: 0.3 },
} as const;

export const shadow = {
  sm: { color: "rgba(0,0,0,0.06)", offset: { width: 0, height: 8 }, opacity: 1, radius: 16, elevation: 2 },
  md: { color: "rgba(0,0,0,0.12)", offset: { width: 0, height: 16 }, opacity: 1, radius: 24, elevation: 4 },
  lg: { color: "rgba(0,0,0,0.16)", offset: { width: 0, height: 24 }, opacity: 1, radius: 32, elevation: 8 },
  cover: { color: "rgba(118,114,128,0.16)", offset: { width: 0, height: 64 }, opacity: 1, radius: 100, elevation: 12 },
  cta: { color: colors.brand, offset: { width: 0, height: 8 }, opacity: 0.4, radius: 20, elevation: 6 },
} as const;

export const shadowCss = {
  sm: "0 0 1px rgba(0,0,0,0.20), 0 8px 16px -4px rgba(0,0,0,0.04)",
  md: "0 0 1px rgba(0,0,0,0.20), 0 0 32px -8px rgba(0,0,0,0.12), 0 32px 32px -8px rgba(0,0,0,0.08)",
  lg: "0 0 1px rgba(0,0,0,0.20), 0 0 48px -12px rgba(0,0,0,0.16), 0 32px 48px -12px rgba(0,0,0,0.12)",
  cover: "0 64px 100px 0 rgba(118,114,128,0.16)",
  cta: `0 8px 20px -8px ${colors.brand}`,
  ring: `0 0 0 4px ${colors.brandSoft}`,
} as const;

export const control = {
  height: {
    sm: 44,
    md: 50,
    lg: 54,
    xl: 56,
    "2xl": 60,
  },
  padX: 16,
} as const;

export const motion = {
  duration: {
    fast: 120,
    base: 200,
    slow: 320,
  },
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  easingOut: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export const tokens = {
  colors,
  spacing,
  screenPad,
  radius,
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textStyle,
  shadow,
  shadowCss,
  control,
  motion,
} as const;

export type Tokens = typeof tokens;
