import { StyleSheet } from "react-native";
import { colors } from "./colors";

const FONT = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const typography = StyleSheet.create({
  display: {
    fontFamily: FONT.bold,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -2.5,
    color: colors.text,
  },
  dsH1: {
    fontFamily: FONT.bold,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -1.5,
    color: colors.text,
  },
  dsH2: {
    fontFamily: FONT.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -1,
    color: colors.text,
  },
  dsH3: {
    fontFamily: FONT.bold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.text,
  },
  dsH4: {
    fontFamily: FONT.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.text,
  },
  bodyMd: {
    fontFamily: FONT.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  bodySm: {
    fontFamily: FONT.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  bodyXs: {
    fontFamily: FONT.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
  eyebrow: {
    fontFamily: FONT.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.textLight,
  },
  label: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: colors.textLight,
  },

  /* Legacy aliases — keep existing screens visually stable.
     Old h1=24/700, h2=18/700, h3=16/700, body=14/500 mapped onto
     the closest DS step (per ADR-010 mapping note). */
  h1: {
    fontFamily: FONT.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: colors.text,
  },
  h2: {
    fontFamily: FONT.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.text,
  },
  h3: {
    fontFamily: FONT.bold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  body: {
    fontFamily: FONT.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  bodyLight: {
    fontFamily: FONT.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textLight,
  },
  small: {
    fontFamily: FONT.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textLight,
  },
  caption: {
    fontFamily: FONT.bold,
    fontSize: 11,
    lineHeight: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.textLight,
  },
  number: {
    fontFamily: FONT.bold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.text,
  },
});
