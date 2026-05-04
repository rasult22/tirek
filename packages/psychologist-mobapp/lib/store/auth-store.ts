import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@tirek/shared";

// Issue #112: источник истины — user.onboardingCompleted с сервера.
// Локальный кеш user живёт в AsyncStorage только чтобы не ждать /me на старте.
interface AuthState {
  token: string | null;
  user: User | null;
  _hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (data: Partial<User>) => void;
  markOnboardingCompletedLocal: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (data) =>
        set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
      markOnboardingCompletedLocal: () =>
        set((s) =>
          s.user ? { user: { ...s.user, onboardingCompleted: true } } : {},
        ),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "tirek-psychologist-auth",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hasHydrated: true });
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
