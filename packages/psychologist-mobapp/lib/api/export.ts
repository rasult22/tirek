import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { useAuthStore } from "../store/auth-store";
import { tirekClient } from "./client";

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

function withTokenQuery(url: string): string {
  const token = useAuthStore.getState().token;
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${token}`;
}

export const exportApi = {
  studentCSV: (studentId: string) => {
    const url = withTokenQuery(
      tirekClient.psychologist.export.studentCsvUrl(studentId),
    );
    return downloadAndShare(url, `student-${studentId}-${Date.now()}.csv`);
  },

  classCSV: (grade?: number, classLetter?: string) => {
    const url = withTokenQuery(
      tirekClient.psychologist.export.classCsvUrl({ grade, classLetter }),
    );
    return downloadAndShare(url, `class-report-${Date.now()}.csv`);
  },
};
