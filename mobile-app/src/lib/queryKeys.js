// @ts-nocheck
// src/lib/queryKeys.js
/**
 * Fuente de verdad centralizada para todas las Query Keys de la app.
 *
 * Patrón: [scope, ...identifiers]
 * - scope:       agrupa por dominio (auth, config, expenses, stations, analytics)
 * - identifiers: refinan la query (userId, cycleId, etc.)
 *
 * Esto permite invalidaciones granulares:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() })
 *   → invalida TODAS las queries de gastos sin tocar config ni estaciones
 */
export const queryKeys = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    profile: () => ["auth", "profile"],
  },

  // ── Configuración de tarjeta (por usuario) ────────────────────────────────
  config: {
    all:  ()         => ["config"],
    user: (userId)   => ["config", userId],
  },

  // ── Gastos (por usuario + ciclo opcional) ─────────────────────────────────
  expenses: {
    all:      ()                    => ["expenses"],
    byCycle:  (cycleId)             => ["expenses", "cycle", cycleId],
    byId:     (id)                  => ["expenses", "detail", id],
    stats:    (cycleId)             => ["expenses", "stats", cycleId],
  },

  // ── Estaciones (globales + propias del usuario) ───────────────────────────
  stations: {
    all:      ()     => ["stations"],
    byId:     (id)   => ["stations", "detail", id],
    // Las globales son iguales para todos — se pueden cachear más tiempo
    global:   ()     => ["stations", "global"],
  },

  // ── Analytics ────────────────────────────────────────────────────────────
  analytics: {
    all:      ()           => ["analytics"],
    cycles:   (months)     => ["analytics", "cycles", months],
    stations: (cycleId)    => ["analytics", "stations", cycleId ?? "all"],
    summary:  ()           => ["analytics", "summary"],
  },
};

/**
 * Qué keys son "privadas" (pertenecen al usuario autenticado)
 * y deben limpiarse al hacer login / logout.
 *
 * Las estaciones globales NO están aquí — son datos públicos del catálogo.
 */
export const USER_SCOPED_QUERY_KEYS = [
  queryKeys.auth.profile(),
  queryKeys.config.all(),
  queryKeys.expenses.all(),
  queryKeys.analytics.all(),
];

/**
 * Configuraciones de staleTime por tipo de dato.
 * Importar directamente en useQuery para consistencia.
 */
export const QUERY_OPTIONS = {
  dynamic: {
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  },
  static: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
};