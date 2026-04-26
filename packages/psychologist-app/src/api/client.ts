import { createTirekClient, ApiError } from "@tirek/shared/api";
import { useAuthStore } from "../store/auth-store.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export { ApiError };
export { BASE_URL };

export const tirekClient = createTirekClient({
  baseUrl: BASE_URL,
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    useAuthStore.getState().logout();
    window.location.href = "/login";
  },
});
