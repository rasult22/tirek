import { tirekClient } from "./client.js";
import { useAuthStore } from "../store/auth-store.js";

async function downloadFile(url: string, filename: string) {
  const token = useAuthStore.getState().token;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error("Export failed");

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

export const exportApi = {
  studentCSV: (studentId: string) =>
    downloadFile(
      tirekClient.psychologist.export.studentCsvUrl(studentId),
      `student-report-${studentId}.csv`,
    ),

  classCSV: (grade?: number, classLetter?: string) => {
    const label = grade ? `${grade}${classLetter ?? ""}` : "all";
    return downloadFile(
      tirekClient.psychologist.export.classCsvUrl({ grade, classLetter }),
      `class-report-${label}.csv`,
    );
  },
};
