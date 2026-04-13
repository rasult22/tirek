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

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface Props extends TextInputProps {
  icon?: IoniconsName;
  containerStyle?: ViewStyle;
}

export function Input({ icon, containerStyle, style, ...props }: Props) {
  const c = useThemeColors();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: focused ? c.primary : c.borderLight,
          backgroundColor: c.surface,
        },
        containerStyle,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={focused ? c.primary : c.textLight}
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
