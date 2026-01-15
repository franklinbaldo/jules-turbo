import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { Toaster } from "./components/ui/toaster";
import React from 'react';

// Placeholders for pages
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const DashboardLayout = React.lazy(() => import("./components/DashboardLayout"));
const SourcesPage = React.lazy(() => import("./pages/SourcesPage"));
const SessionsPage = React.lazy(() => import("./pages/SessionsPage"));
const SessionDetailPage = React.lazy(() => import("./pages/SessionDetailPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename="/jules-turbo">
          <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                 <Route index element={<Navigate to="/sessions" replace />} />
                 <Route path="sources" element={<SourcesPage />} />
                 <Route path="sessions" element={<SessionsPage />} />
                 <Route path="sessions/:sessionId/*" element={<SessionDetailPage />} />
              </Route>
            </Routes>
          </React.Suspense>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
