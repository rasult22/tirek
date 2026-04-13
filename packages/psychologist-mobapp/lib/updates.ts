import * as Updates from "expo-updates";
import { Alert } from "react-native";

export async function checkForUpdate() {
  if (__DEV__) return;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        "Доступно обновление",
        "Перезапустить приложение для применения обновления?",
        [
          { text: "Позже", style: "cancel" },
          { text: "Перезапустить", onPress: () => Updates.reloadAsync() },
        ],
      );
    }
  } catch {
    // silently fail — OTA check is non-critical
  }
}
