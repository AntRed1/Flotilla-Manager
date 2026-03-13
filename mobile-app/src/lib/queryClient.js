// @ts-nocheck
// src/lib/queryClient.js
import { QueryClient } from "@tanstack/react-query";

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // Datos privados del usuario → nunca stale (siempre re-fetcha al montar)
      staleTime: 0,

      // Mantener en memoria 5 min antes de garbage-collect
      gcTime: 5 * 60 * 1000,

      // Solo 1 reintento automático en errores de red
      retry: 1,

      // No re-fetchar al volver al tab (el hook de auth ya se encarga)
      refetchOnWindowFocus: false,

      // Re-fetchar automáticamente al reconectarse a internet
      refetchOnReconnect: true,
    },
  },
});

/**
 * Configuraciones específicas por tipo de dato.
 * Úsalas en useQuery({ ...QUERY_OPTIONS.static }) para datos que raramente cambian.
 *
 * Ejemplo:
 *   const { data } = useQuery({
 *     queryKey: queryKeys.stations.global(),
 *     queryFn: () => apiClient.getStations(),
 *     ...QUERY_OPTIONS.static,
 *   });
 */
export const QUERY_OPTIONS = {
  // Datos de usuario: siempre frescos
  dynamic: {
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  },

  // Catálogo global (estaciones TotalEnergies): cachear 10 min
  static: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
};