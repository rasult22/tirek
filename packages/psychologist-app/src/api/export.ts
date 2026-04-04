import { useAuthStore } from "../store/auth-store.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function downloadFile(path: string, filename: string) {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error("Export failed");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportApi = {
  studentCSV: (studentId: string) =>
    downloadFile(`/psychologist/export/students/${studentId}/csv`, `student-report-${studentId}.csv`),

  classCSV: (grade?: number, classLetter?: string) => {
    const params = new URLSearchParams();
    if (grade) params.set("grade", String(grade));
    if (classLetter) params.set("classLetter", classLetter);
    const label = grade ? `${grade}${classLetter ?? ""}` : "all";
    return downloadFile(`/psychologist/export/class/csv?${params}`, `class-report-${label}.csv`);
  },
};
