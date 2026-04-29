import {
  View,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, type ComponentProps } from "react";
import { useThemeColors, radius } from "../../lib/theme";
import { Text } from "./Text";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface Props extends TextInputProps {
  icon?: IoniconsName;
  error?: boolean;
  helperText?: string;
  containerStyle?: ViewStyle;
}

export function Input({ icon, error, helperText, containerStyle, style, ...props }: Props) {
  const c = useThemeColors();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? c.danger
    : focused
      ? c.primary
      : c.borderLight;

  return (
    <View style={containerStyle}>
      <View
        style={[
          styles.container,
          {
            borderColor,
            backgroundColor: c.surface,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={error ? c.danger : focused ? c.primary : c.textLight}
            style={styles.icon}
          />
        )}
        <TextInput
          placeholderTextColor={c.textLight}
          style={[styles.input, { color: c.text }, icon && styles.inputWithIcon, style]}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {helperText && (
        <Text
          variant="bodyXs"
          style={{ color: error ? c.danger : c.textLight, marginTop: 6, marginLeft: 4 }}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  icon: {
    position: "absolute",
    left: 14,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
});
