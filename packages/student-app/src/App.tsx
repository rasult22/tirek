import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "./hooks/useLanguage.js";
import { useAuthStore } from "./store/auth-store.js";

// Pages
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { OnboardingPage } from "./pages/OnboardingPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { MoodCheckInPage } from "./pages/MoodCheckInPage.js";
import { MoodCalendarPage } from "./pages/MoodCalendarPage.js";
import { ChatListPage } from "./pages/ChatListPage.js";
import { ChatPage } from "./pages/ChatPage.js";
import { TestsListPage } from "./pages/TestsListPage.js";
import { TestPage } from "./pages/TestPage.js";
import { TestResultPage } from "./pages/TestResultPage.js";
import { ExercisesListPage } from "./pages/ExercisesListPage.js";
import { BreathingPage } from "./pages/BreathingPage.js";
import { ExerciseRouterPage } from "./pages/ExerciseRouterPage.js";
import { SOSPage } from "./pages/SOSPage.js";
import { JournalPage } from "./pages/JournalPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/mood" element={<ProtectedRoute><MoodCheckInPage /></ProtectedRoute>} />
            <Route path="/mood/calendar" element={<ProtectedRoute><MoodCalendarPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
            <Route path="/chat/:sessionId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/tests" element={<ProtectedRoute><TestsListPage /></ProtectedRoute>} />
            <Route path="/tests/:testId" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />
            <Route path="/tests/results/:sessionId" element={<ProtectedRoute><TestResultPage /></ProtectedRoute>} />
            <Route path="/exercises" element={<ProtectedRoute><ExercisesListPage /></ProtectedRoute>} />
            <Route path="/exercises/:id" element={<ProtectedRoute><ExerciseRouterPage /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
            <Route path="/sos" element={<SOSPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
