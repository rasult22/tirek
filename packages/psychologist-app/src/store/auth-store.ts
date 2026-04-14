import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@tirek/shared";

interface AuthState {
  token: string | null;
  user: User | null;
  onboardingCompleted: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (data: Partial<User>) => void;
  completeOnboarding: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      onboardingCompleted: false,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (data) => set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      logout: () => set({ token: null, user: null, onboardingCompleted: false }),
    }),
    { name: "tirek-psychologist-auth" },
  ),
);
