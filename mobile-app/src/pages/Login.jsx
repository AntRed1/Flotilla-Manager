// @ts-nocheck
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Fuel, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validatePassword(p) { return p.length >= 6; }
function validateName(n) { return n.trim().length >= 2; }

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fields, setFields] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (mode === "register" && !validateName(fields.name))
      errs.name = "Mínimo 2 caracteres";
    if (!validateEmail(fields.email))
      errs.email = "Correo inválido";
    if (!validatePassword(fields.password))
      errs.password = "Mínimo 6 caracteres";
    if (mode === "register" && fields.password !== fields.confirmPassword)
      errs.confirmPassword = "Las contraseñas no coinciden";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      if (mode === "login") {
        await login({ email: fields.email, password: fields.password });
        toast.success("¡Bienvenido de nuevo!");
      } else {
        await register({ name: fields.name.trim(), email: fields.email, password: fields.password });
        toast.success("¡Cuenta creada! Bienvenido a Flotilla.");
      }
    } catch (err) {
      toast.error(err.message || (mode === "login" ? "Credenciales incorrectas" : "Error al crear la cuenta"));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setFields({ name: "", email: "", password: "", confirmPassword: "" });
    setShowPassword(false);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <Fuel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Flotilla Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Flotilla — Control de Gastos</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6">

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            {[{ key: "login", label: "Iniciar sesión" }, { key: "register", label: "Crear cuenta" }].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchMode(tab.key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${mode === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Nombre — solo registro */}
            {mode === "register" && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={fields.name}
                  onChange={set("name")}
                  className={`w-full h-12 px-4 rounded-xl bg-gray-50 border-2 text-sm outline-none transition-colors
                    ${errors.name ? "border-red-300" : "border-transparent focus:border-emerald-400"}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 px-1">{errors.name}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={fields.email}
                onChange={set("email")}
                autoComplete="email"
                className={`w-full h-12 px-4 rounded-xl bg-gray-50 border-2 text-sm outline-none transition-colors
                  ${errors.email ? "border-red-300" : "border-transparent focus:border-emerald-400"}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1 px-1">{errors.email}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Contraseña</label>
              <div className={`flex items-center h-12 bg-gray-50 rounded-xl border-2 px-4 transition-colors
                ${errors.password ? "border-red-300" : "border-transparent focus-within:border-emerald-400"}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : "••••••••"}
                  value={fields.password}
                  onChange={set("password")}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-gray-400 hover:text-gray-600 ml-2">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1 px-1">{errors.password}</p>}
            </div>

            {/* Confirmar contraseña — solo registro */}
            {mode === "register" && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirmar contraseña</label>
                <div className={`flex items-center h-12 bg-gray-50 rounded-xl border-2 px-4 transition-colors
                  ${errors.confirmPassword ? "border-red-300" : "border-transparent focus-within:border-emerald-400"}`}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={fields.confirmPassword}
                    onChange={set("confirmPassword")}
                    autoComplete="new-password"
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-gray-400 hover:text-gray-600 ml-2">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 px-1">{errors.confirmPassword}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700
                text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-colors mt-2
                flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{mode === "login" ? "Iniciando sesión..." : "Creando cuenta..."}</>
              ) : (
                mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          © {new Date().getFullYear()}  Flotilla Manager. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}