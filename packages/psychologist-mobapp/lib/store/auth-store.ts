import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@tirek/shared";

interface AuthState {
  token: string | null;
  user: User | null;
  onboardingCompleted: boolean;
  _hasHydrated: boolean;
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
      _hasHydrated: false,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (data) =>
        set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      logout: () => set({ token: null, user: null, onboardingCompleted: false }),
    }),
    {
      name: "tirek-psychologist-auth",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Existing users who already have a token but no onboardingCompleted
        // should not be forced through onboarding
        if (state?.token && state.onboardingCompleted === undefined) {
          useAuthStore.setState({ _hasHydrated: true, onboardingCompleted: true });
        } else {
          useAuthStore.setState({ _hasHydrated: true });
        }
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        onboardingCompleted: state.onboardingCompleted,
      }),
    },
  ),
);
