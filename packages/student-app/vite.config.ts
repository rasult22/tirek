import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@tirek/shared/i18n": path.resolve(__dirname, "../shared/src/i18n/index.ts"),
      "@tirek/shared/constants": path.resolve(__dirname, "../shared/src/constants/index.ts"),
      "@tirek/shared/types": path.resolve(__dirname, "../shared/src/types/index.ts"),
      "@tirek/shared/language-sync": path.resolve(__dirname, "../shared/src/language-sync/index.ts"),
      "@tirek/shared/validators": path.resolve(__dirname, "../shared/src/validators/index.ts"),
      "@tirek/shared/evening-prompt": path.resolve(__dirname, "../shared/src/evening-prompt/index.ts"),
      "@tirek/shared/api": path.resolve(__dirname, "../shared/src/api/index.ts"),
      "@tirek/shared/mood-last-7-days": path.resolve(__dirname, "../shared/src/mood-last-7-days/index.ts"),
      "@tirek/shared/format-print-profile": path.resolve(__dirname, "../shared/src/format-print-profile/index.ts"),
      "@tirek/shared/office-hours": path.resolve(__dirname, "../shared/src/office-hours/index.ts"),
      "@tirek/shared/design-system": path.resolve(__dirname, "../shared/src/design-system/index.ts"),
      "@tirek/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
  server: {
    port: 5173,
  },
});
