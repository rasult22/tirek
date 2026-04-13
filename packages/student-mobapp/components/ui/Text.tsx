import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { typography, useThemeColors } from "../../lib/theme";

type Variant = keyof typeof typography;

const textColorVariants: Record<Variant, "text" | "textLight"> = {
  h1: "text",
  h2: "text",
  h3: "text",
  body: "text",
  bodyLight: "textLight",
  small: "textLight",
  caption: "textLight",
  number: "text",
};

interface Props extends TextProps {
  variant?: Variant;
}

export function Text({ variant = "body", style, ...props }: Props) {
  const c = useThemeColors();

  return (
    <RNText
      style={[
        typography[variant] as TextStyle,
        { color: c[textColorVariants[variant]] },
        style,
      ]}
      {...props}
    />
  );
}
