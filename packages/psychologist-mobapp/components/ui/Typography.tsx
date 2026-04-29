import { Text } from "./Text";
import type { TextProps } from "react-native";

export const H1 = (props: TextProps) => <Text variant="dsH1" {...props} />;
export const H2 = (props: TextProps) => <Text variant="dsH2" {...props} />;
export const H3 = (props: TextProps) => <Text variant="dsH3" {...props} />;
export const H4 = (props: TextProps) => <Text variant="dsH4" {...props} />;

type BodySize = "md" | "sm" | "xs";
const bodyVariant: Record<BodySize, "bodyMd" | "bodySm" | "bodyXs"> = {
  md: "bodyMd",
  sm: "bodySm",
  xs: "bodyXs",
};

export const Body = ({ size = "md", ...props }: TextProps & { size?: BodySize }) => (
  <Text variant={bodyVariant[size]} {...props} />
);

export const Caption = (props: TextProps) => <Text variant="caption" {...props} />;
export const Eyebrow = (props: TextProps) => <Text variant="eyebrow" {...props} />;
export const Label = (props: TextProps) => <Text variant="label" {...props} />;
