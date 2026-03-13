// @ts-nocheck
// src/lib/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "@/api/authAPI";
import { useInvalidateOnAuth } from "@/hooks/useInvalidateOnAuth";

const AuthContext = createContext();

/**
 * Wrapper interno que conecta el userId al hook de invalidación.
 * Separado del Provider para poder usar useQueryClient dentro del árbol.
 */
function AuthInvalidator({ userId }) {
  useInvalidateOnAuth(userId);
  return null;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [error, setError]                     = useState(null);

  useEffect(() => { checkAuth(); }, []);

  // ── Verificar sesión al montar ──────────────────────────────────────────
  const checkAuth = async () => {
    if (!authAPI.isAuthenticated()) {
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }
    try {
      const result = await authAPI.getProfile();
      if (result.success) {
        setUser(result.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        authAPI.clearTokens();
      }
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      authAPI.clearTokens();
      if (!err.message?.includes("Sesión expirada") && !err.message?.includes("Session expired")) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Login ────────────────────────────────────────────────────────────────
  // La invalidación de caché ocurre automáticamente en AuthInvalidator
  // cuando userId cambia de null → ID real
  const login = async (credentials) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await authAPI.login(credentials);
      if (result.success) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        return result.data;
      }
      throw new Error(result.error || "Credenciales incorrectas");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Registro ─────────────────────────────────────────────────────────────
  const register = async ({ name, email, password }) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await authAPI.register({ name, email, password });
      if (result.success) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        return result.data;
      }
      throw new Error(result.error || "Error al crear la cuenta");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  // La limpieza de caché ocurre automáticamente en AuthInvalidator
  // cuando userId cambia de ID real → null
  const logout = async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      window.location.href = "/login";
    }
  };

  // ── Refresh user ─────────────────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const result = await authAPI.getProfile();
      if (result.success) {
        setUser(result.data.user);
        setError(null);
      }
    } catch (err) {
      console.error("User refresh failed:", err);
    }
  };

  // ── Cambiar contraseña ───────────────────────────────────────────────────
  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await authAPI.changePassword({ currentPassword, newPassword });
      if (result.success) {
        setUser(null);
        setIsAuthenticated(false);
        return result;
      }
      throw new Error(result.error || "Error al cambiar contraseña");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole    = (role)  => authAPI.hasRole(role);
  const hasAnyRole = (roles) => authAPI.hasAnyRole(roles);
  const clearError = ()      => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user, isAuthenticated, isLoading, error,
        login, register, logout, refreshUser, changePassword,
        hasRole, hasAnyRole, clearError,
      }}
    >
      {/* Componente invisible que reacciona a cambios de userId */}
      <AuthInvalidator userId={user?.id ?? null} />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export default AuthContext;