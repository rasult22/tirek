import { Component, type ReactNode } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./ui";
import { colors, radius } from "../lib/theme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning" size={40} color={colors.danger} />
          </View>
          <Text variant="h2" style={styles.title}>
            Что-то пошло не так
          </Text>
          <Text variant="bodyLight" style={styles.desc}>
            Произошла непредвиденная ошибка. Попробуйте ещё раз.
          </Text>
          <Pressable
            onPress={this.handleReset}
            style={({ pressed }) => [
              styles.btn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.btnText}>Попробовать снова</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(179,59,59,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 20,
  },
  desc: {
    marginTop: 8,
    textAlign: "center",
    maxWidth: 280,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
