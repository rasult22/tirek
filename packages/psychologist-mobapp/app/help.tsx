import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { H3, Body } from "../components/ui";
import { useThemeColors, spacing } from "../lib/theme";

export default function HelpModal() {
  const c = useThemeColors();
  const params = useLocalSearchParams<{
    title?: string;
    description?: string;
  }>();

  return (
    <View style={[styles.root, { backgroundColor: c.surface }]}>
      <View style={styles.header}>
        <H3>{params.title ?? ""}</H3>
      </View>
      <View style={styles.body}>
        {params.description ? (
          <Body style={{ lineHeight: 22 }}>{params.description}</Body>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.lg,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
