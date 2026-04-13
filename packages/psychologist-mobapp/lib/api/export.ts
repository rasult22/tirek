import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { useAuthStore } from "../store/auth-store";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

async function downloadAndShare(url: string, filename: string) {
  if (Platform.OS === "web") {
    return Linking.openURL(url);
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    return Linking.openURL(url);
  }

  const file = new File(Paths.cache, filename);
  const response = await fetch(url);
  const text = await response.text();
  file.write(text);

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    UTI: "public.comma-separated-values-text",
  });
}

export const exportApi = {
  studentCSV: (studentId: string) => {
    const token = useAuthStore.getState().token;
    const url = `${BASE_URL}/psychologist/export/students/${studentId}/csv?token=${token}`;
    const filename = `student-${studentId}-${Date.now()}.csv`;
    return downloadAndShare(url, filename);
  },

  classCSV: (grade?: number, classLetter?: string) => {
    const token = useAuthStore.getState().token;
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    if (grade) params.set("grade", String(grade));
    if (classLetter) params.set("classLetter", classLetter);
    const url = `${BASE_URL}/psychologist/export/class/csv?${params}`;
    const filename = `class-report-${Date.now()}.csv`;
    return downloadAndShare(url, filename);
  },
};
