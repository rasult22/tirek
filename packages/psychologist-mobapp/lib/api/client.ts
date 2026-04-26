import { createTirekClient, ApiError } from "@tirek/shared/api";
import { useAuthStore } from "../store/auth-store";
import { router } from "expo-router";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export { ApiError };
export { BASE_URL };

export const tirekClient = createTirekClient({
  baseUrl: BASE_URL,
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    useAuthStore.getState().logout();
    router.replace("/login");
  },
});
