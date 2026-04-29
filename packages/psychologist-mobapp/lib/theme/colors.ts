import { colors as ds } from "@tirek/shared/design-system";

export const lightColors = {
  primary: ds.brand,
  primaryDark: ds.brandDeep,
  secondary: "#2D6D8C",
  accent: "#99DDD7",
  info: ds.info,
  success: ds.success,
  warning: ds.warning,
  danger: ds.danger,
  bg: ds.bg,
  text: ds.ink,
  textLight: ds.inkMuted,
  surface: ds.surface,
  surfaceSecondary: ds.surface2,
  surfaceHover: ds.hover,
  border: ds.hairline,
  borderLight: ds.hairline,
  inputBorder: ds.hairline,
} as const;

export type ThemeColors = {
  [K in keyof typeof lightColors]: string;
};

/** @deprecated Use useThemeColors() hook instead */
export const colors = lightColors;
