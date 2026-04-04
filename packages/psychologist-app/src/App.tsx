import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "./hooks/useLanguage.js";
import { useAuthStore } from "./store/auth-store.js";
import { AppLayout } from "./components/ui/AppLayout.js";

// Pages
import { LoginPage } from "./pages/LoginPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { StudentsListPage } from "./pages/StudentsListPage.js";
import { StudentDetailPage } from "./pages/StudentDetailPage.js";
import { DiagnosticsPage } from "./pages/DiagnosticsPage.js";
import { AssignTestPage } from "./pages/AssignTestPage.js";
import { CrisisPage } from "./pages/CrisisPage.js";
import { InviteCodesPage } from "./pages/InviteCodesPage.js";
import { AnalyticsPage } from "./pages/AnalyticsPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { DirectChatListPage } from "./pages/DirectChatListPage.js";
import { DirectChatPage } from "./pages/DirectChatPage.js";
import { AppointmentsListPage } from "./pages/AppointmentsListPage.js";
import { SlotsManagementPage } from "./pages/SlotsManagementPage.js";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  if (!token) return <Navigate to="/login" replace />;
  if (user && user.role !== "psychologist" && user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/students" element={<ProtectedRoute><StudentsListPage /></ProtectedRoute>} />
            <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
            <Route path="/diagnostics" element={<ProtectedRoute><DiagnosticsPage /></ProtectedRoute>} />
            <Route path="/diagnostics/assign" element={<ProtectedRoute><AssignTestPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><DirectChatListPage /></ProtectedRoute>} />
            <Route path="/messages/:conversationId" element={<ProtectedRoute><DirectChatPage /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><AppointmentsListPage /></ProtectedRoute>} />
            <Route path="/appointments/slots" element={<ProtectedRoute><SlotsManagementPage /></ProtectedRoute>} />
            <Route path="/crisis" element={<ProtectedRoute><CrisisPage /></ProtectedRoute>} />
            <Route path="/invite-codes" element={<ProtectedRoute><InviteCodesPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
