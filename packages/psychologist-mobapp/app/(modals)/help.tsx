import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../components/ui";
import { H3, Body } from "../../components/ui/Typography";
import { useThemeColors, spacing } from "../../lib/theme";
import { useHelpSheetStore } from "../../lib/sheets/help";

export default function HelpModal() {
  const c = useThemeColors();
  const payload = useHelpSheetStore((s) => s.payload);

  if (!payload) return null;

  return (
    <View style={[styles.root, { backgroundColor: c.surface }]}>
      <View style={styles.header}>
        <H3 style={{ flex: 1 }}>{payload.title}</H3>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {payload.description ? (
          <Body style={{ lineHeight: 22 }}>{payload.description}</Body>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  body: {
    paddingHorizontal: spacing.xl,
  },
  bodyContent: {
    paddingBottom: spacing["3xl"],
  },
});
