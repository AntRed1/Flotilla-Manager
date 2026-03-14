// src/components/settings/DeveloperFooter.jsx
import React, { useState } from "react";
import { Linkedin, Mail, Code2, ExternalLink, Check } from "lucide-react";
import { AppLauncher } from '@capacitor/app-launcher'; // ← Asegúrate de tenerlo instalado

const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.0";
const rawDate = typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : new Date().toISOString();
const buildDate = (() => {
  try { return new Date(rawDate); } catch { return new Date(); }
})();
const BUILD_LABEL =
  buildDate.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" }) +
  " · " +
  buildDate.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });

const LINKEDIN_URL = "https://www.linkedin.com/in/anthonyrojasv";
const EMAIL = "anthonyatras@gmail.com";

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Copia texto al portapapeles con fallback para Android WebView
 */
function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  }
  return Promise.resolve(legacyCopy(text));
}

function legacyCopy(text: string) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try {
    document.execCommand("copy");
  } catch (_) {
    /* silencioso */
  }
  document.body.removeChild(el);
}

/**
 * Abre una URL con Capacitor Browser (in-app) si está disponible
 */
async function openUrl(url: string) {
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DeveloperFooter() {
  const [copied, setCopied] = useState(false);
  const [openingMail, setOpeningMail] = useState(false);

  const handleCopyEmail = async () => {
    await copyToClipboard(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLinkedIn = (e: React.MouseEvent) => {
    e.preventDefault();
    openUrl(LINKEDIN_URL);
  };

  const handleEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    setOpeningMail(true);

    const subject = encodeURIComponent("Consulta sobre la app");
    const body = encodeURIComponent("Hola Anthony,\n\nEscribo desde la app...\n");
    const mailtoLink = `mailto:${EMAIL}?subject=${subject}&body=${body}`;

    try {
      // Intento nativo con AppLauncher (mejor integración en Android/iOS)
      await AppLauncher.openUrl({ url: mailtoLink });
      // Si llega aquí sin error → se abrió el cliente de correo
    } catch (err) {
      console.warn("No se pudo abrir mailto nativamente:", err);

      // Fallback: intento clásico
      try {
        window.location.href = mailtoLink;
      } catch (fallbackErr) {
        console.error("Fallback mailto también falló:", fallbackErr);
        // Último recurso: copiar y avisar
        await copyToClipboard(EMAIL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } finally {
      setTimeout(() => setOpeningMail(false), 800);
    }
  };

  return (
    <div className="mt-8 mb-2 space-y-3">
      {/* Divider decorativo */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <Code2 className="w-3.5 h-3.5 text-gray-300" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Card del desarrollador */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
        <div className="p-4 space-y-4">
          {/* Avatar + Nombre */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/20">
              <span className="text-white text-xs font-bold tracking-wider">AJR</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                Anthony J. Rojas Valdez
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Desarrollador de Software</p>
            </div>
          </div>

          {/* Botones de contacto */}
          <div className="flex gap-2">
            {/* LinkedIn */}
            <a
              href={LINKEDIN_URL}
              onClick={handleLinkedIn}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-blue-50 active:bg-blue-200 rounded-xl text-blue-600 text-xs font-medium transition-colors select-none"
            >
              <Linkedin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>LinkedIn</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
            </a>

            {/* Email - abre cliente de correo (Gmail si predeterminado) */}
            <button
              onClick={handleEmail}
              disabled={openingMail}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-medium transition-colors select-none ${
                copied
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700"
              } disabled:opacity-60`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                  <span className="font-semibold">¡Copiado!</span>
                </>
              ) : openingMail ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>Abriendo...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Contacto</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Versión + fecha de build */}
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-xs text-gray-300 font-medium tracking-wide">
          v{APP_VERSION}
        </span>
        <span className="text-xs text-gray-300">{BUILD_LABEL}</span>
      </div>
    </div>
  );
}