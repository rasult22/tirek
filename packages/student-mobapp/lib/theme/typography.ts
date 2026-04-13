import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const typography = StyleSheet.create({
  h1: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  h3: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  bodyLight: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textLight,
  },
  small: {
    fontSize: 12,
    color: colors.textLight,
  },
  caption: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.textLight,
  },
  number: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
});
