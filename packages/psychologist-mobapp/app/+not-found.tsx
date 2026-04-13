import { View, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, Button } from "../components/ui";
import { useThemeColors, radius } from "../lib/theme";

export default function NotFoundScreen() {
  const c = useThemeColors();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${c.textLight}1A` }]}>
          <Ionicons name="help-circle-outline" size={48} color={c.textLight} />
        </View>
        <Text variant="h2" style={styles.title}>
          Страница не найдена
        </Text>
        <Text variant="bodyLight" style={styles.desc}>
          Запрашиваемая страница не существует или была удалена.
        </Text>
        <Button
          title="На главную"
          onPress={() => router.replace("/(tabs)")}
          style={styles.btn}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 20,
    textAlign: "center",
  },
  desc: {
    marginTop: 8,
    textAlign: "center",
    maxWidth: 280,
  },
  btn: {
    marginTop: 24,
    minWidth: 180,
  },
});
