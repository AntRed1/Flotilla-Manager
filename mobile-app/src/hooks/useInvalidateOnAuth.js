// @ts-nocheck
// src/hooks/useInvalidateOnAuth.js
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { USER_SCOPED_QUERY_KEYS } from "@/lib/queryKeys";

/**
 * Hook que invalida (o elimina) las queries del usuario anterior
 * cada vez que cambia el userId.
 *
 * - Al hacer LOGIN:  invalida → las queries se re-fetchen con el nuevo token
 * - Al hacer LOGOUT: elimina  → no queda caché de datos privados en memoria
 *
 * No toca estaciones globales ni otros datos públicos.
 */
export function useInvalidateOnAuth(userId) {
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef(undefined);

  useEffect(() => {
    const prevUserId = prevUserIdRef.current;

    // Primera carga: solo registrar el userId sin invalidar
    if (prevUserId === undefined) {
      prevUserIdRef.current = userId;
      return;
    }

    // Sin cambio real
    if (prevUserId === userId) return;

    if (userId) {
      // LOGIN: nuevo usuario → invalidar datos de usuario anterior
      // "invalidate" conserva el caché stale pero dispara re-fetch inmediato
      USER_SCOPED_QUERY_KEYS.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key, exact: false });
      });
    } else {
      // LOGOUT: limpiar datos privados de memoria completamente
      USER_SCOPED_QUERY_KEYS.forEach((key) => {
        queryClient.removeQueries({ queryKey: key, exact: false });
      });
    }

    prevUserIdRef.current = userId;
  }, [userId, queryClient]);
}