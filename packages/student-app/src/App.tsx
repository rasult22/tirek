import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { LanguageProvider } from "./hooks/useLanguage.js";
import { useAuthStore } from "./store/auth-store.js";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.js";
import { NetworkStatus } from "./components/ui/NetworkStatus.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";

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
import { DirectChatListPage } from "./pages/DirectChatListPage.js";
import { DirectChatPage } from "./pages/DirectChatPage.js";
import { AppointmentsPage } from "./pages/AppointmentsPage.js";
import { VirtualPlantPage } from "./pages/VirtualPlantPage.js";
import { AchievementsPage } from "./pages/AchievementsPage.js";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);
  if (!token) return <Navigate to="/login" replace />;
  if (!onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);
  if (!token) return <Navigate to="/login" replace />;
  if (onboardingCompleted) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ErrorBoundary>
        <Toaster position="top-center" richColors closeButton duration={3000} />
        <NetworkStatus />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
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
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/history" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
            <Route path="/chat/:sessionId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/tests" element={<ProtectedRoute><TestsListPage /></ProtectedRoute>} />
            <Route path="/tests/:testId" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />
            <Route path="/tests/results/:sessionId" element={<ProtectedRoute><TestResultPage /></ProtectedRoute>} />
            <Route path="/exercises" element={<ProtectedRoute><ExercisesListPage /></ProtectedRoute>} />
            <Route path="/exercises/:id" element={<ProtectedRoute><ExerciseRouterPage /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><DirectChatListPage /></ProtectedRoute>} />
            <Route path="/messages/:conversationId" element={<ProtectedRoute><DirectChatPage /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
            <Route path="/plant" element={<ProtectedRoute><VirtualPlantPage /></ProtectedRoute>} />
            <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
            <Route path="/sos" element={<SOSPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
