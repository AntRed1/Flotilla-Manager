// @ts-nocheck
// src/pages/Settings.jsx
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/apiClient";
import { queryKeys, QUERY_OPTIONS } from "@/lib/queryKeys";
import { useAuth } from "@/lib/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import CardConfigForm from "@/components/settings/CardConfigForm";
import StationManager from "@/components/settings/StationManager";
import DeveloperFooter from "@/components/settings/DeveloperFooter";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { LogOut } from "lucide-react";

// ─── Modal de confirmación de logout ─────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mx-auto mb-4">
          <LogOut className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center">Cerrar sesión</h2>
        <p className="text-sm text-gray-500 text-center mt-1 mb-6">
          ¿Estás seguro que quieres salir de tu cuenta?
        </p>
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full h-13 rounded-2xl bg-red-500 hover:bg-red-600 active:bg-red-700
              text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2
              disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cerrando sesión...
              </span>
            ) : "Sí, cerrar sesión"}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full h-13 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300
              text-gray-700 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings principal ───────────────────────────────────────────────────────
export default function Settings() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: queryKeys.config.all(),
    queryFn: () => apiClient.getConfig().then((r) => r.data ?? r),
    ...QUERY_OPTIONS.dynamic,
  });

  const { data: stations = [], isLoading: stationsLoading } = useQuery({
    queryKey: queryKeys.stations.all(),
    queryFn: () => apiClient.getStations().then((r) => r.data ?? r),
    ...QUERY_OPTIONS.static,
  });

  const handleRefresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.all() }),
    ]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  if (configLoading || stationsLoading) {
    return (
      <div className="px-4 pt-4 pb-24 space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 pt-2 pb-24">

          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
            <p className="text-sm text-gray-400 mt-1">Configura tu tarjeta y estaciones</p>
          </div>

          <div className="space-y-6">

            {/* ── Perfil + Logout ── */}
            <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold tracking-wide">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name ?? "Usuario"}
                  </p>
                  <span className="flex-shrink-0 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {user?.role === "ADMIN" ? "Admin" : "Usuario"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {user?.email ?? ""}
                </p>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex-shrink-0 w-9 h-9 bg-red-50 hover:bg-red-100 active:bg-red-200
                  rounded-xl flex items-center justify-center transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 text-red-500" />
              </button>
            </div>

            {/* Configuración de tarjeta y estaciones */}
            <CardConfigForm config={config} onSave={handleRefresh} />
            <StationManager stations={stations} onRefresh={handleRefresh} />

            {/* ── Footer del desarrollador ── */}
            <DeveloperFooter />

          </div>
        </div>
      </PullToRefresh>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => !isLoggingOut && setShowLogoutModal(false)}
          isLoading={isLoggingOut}
        />
      )}
    </>
  );
}