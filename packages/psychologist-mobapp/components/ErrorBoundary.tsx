import { Component, type ReactNode } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./ui";
import { useThemeColors, radius } from "../lib/theme";
import { Sentry } from "../lib/sentry";

/* ── Functional fallback that respects theme ── */

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const c = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${c.danger}1A` },
        ]}
      >
        <Ionicons name="warning" size={40} color={c.danger} />
      </View>
      <Text variant="h2" style={styles.title}>
        Что-то пошло не так
      </Text>
      <Text variant="bodyLight" style={styles.desc}>
        Произошла непредвиденная ошибка. Попробуйте ещё раз.
      </Text>
      <Pressable
        onPress={onReset}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: c.primary },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.btnText}>Попробовать снова</Text>
      </Pressable>
    </View>
  );
}

/* ── Class component error boundary ── */

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
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
