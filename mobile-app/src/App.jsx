import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/queryClient";
import { pagesConfig } from "./pages.config";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import Login from "./pages/Login";

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => <div>No page configured</div>;

// ─── Loader bonito con ⛽ ─────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center animate-pulse">
        <span className="text-2xl">⛽</span>
      </div>
      <p className="text-sm text-gray-400 font-medium">Cargando...</p>
    </div>
  </div>
);

// ─── ProtectedRoute + Layout ─────────────────────────────────────────────────
const ProtectedRoute = ({ children, currentPageName }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    <>{children}</>
  );
};

// ─── Rutas ───────────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Página principal (definida en pages.config) */}
      <Route
        path="/"
        element={
          <ProtectedRoute currentPageName={mainPageKey}>
            <MainPage />
          </ProtectedRoute>
        }
      />

      {/* Resto de páginas dinámicas */}
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <ProtectedRoute currentPageName={path}>
              <Page />
            </ProtectedRoute>
          }
        />
      ))}

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ─── App Principal ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}