import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatMoney } from "@/utils";

// Detecta si estamos en Capacitor (Android/iOS)
const isNative = () => window?.Capacitor?.isNativePlatform?.() === true;

// ─── Genera el HTML del reporte ────────────────────────────────────────────
function buildReportHTML({ expenses, cycleLabel, totalSpent, config }) {
  const rows = expenses
    .map(
      (exp) => `
      <tr>
        <td>${format(new Date(exp.date), "d MMM yyyy", { locale: es })}</td>
        <td>${exp.stationName || exp.station_name || "—"}</td>
        <td class="amount">${formatMoney(exp.amount)}</td>
        <td>${exp.odometer ? exp.odometer.toLocaleString() + " km" : "—"}</td>
        <td>${exp.notes || "—"}</td>
      </tr>`
    )
    .join("");

  const limit     = config?.monthlyLimit || config?.monthly_limit || 10000;
  const remaining = Math.max(0, limit - totalSpent);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reporte ${cycleLabel} - Flotilla Manager</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 32px; max-width: 820px; margin: 0 auto; color: #1F2937; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #10B981; padding-bottom: 20px; }
    .header h1 { margin: 0 0 6px; font-size: 26px; }
    .header p  { margin: 4px 0; color: #6B7280; font-size: 14px; }
    .summary { background: #F3F4F6; padding: 20px; border-radius: 12px; margin-bottom: 28px; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .summary-item label { display: block; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
    .summary-item span  { display: block; font-size: 20px; font-weight: 700; }
    h2 { font-size: 16px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #F3F4F6; padding: 10px 12px; text-align: left; font-size: 11px; color: #6B7280; text-transform: uppercase; }
    td { padding: 10px 12px; border-bottom: 1px solid #E5E7EB; }
    .amount { font-weight: 600; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 2px solid #E5E7EB; text-align: center; font-size: 12px; color: #9CA3AF; }
    .print-btn { margin-top: 28px; text-align: center; }
    .print-btn button {
      background: #10B981; color: white; border: none;
      padding: 12px 28px; border-radius: 8px; cursor: pointer;
      font-size: 14px; font-weight: 600; margin: 0 6px;
    }
    .print-btn button.secondary { background: #E5E7EB; color: #1F2937; }
    @media print {
      .print-btn { display: none; }
      body { padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⛽ Flotilla Manager</h1>
    <p>Reporte de Consumo — ${cycleLabel}</p>
    <p>Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
  </div>

  <div class="summary">
    <div class="summary-grid">
      <div class="summary-item"><label>Total Gastado</label><span>${formatMoney(totalSpent)}</span></div>
      <div class="summary-item"><label>Saldo Restante</label><span>${formatMoney(remaining)}</span></div>
      <div class="summary-item"><label>Límite Mensual</label><span>${formatMoney(limit)}</span></div>
      <div class="summary-item"><label>Transacciones</label><span>${expenses.length}</span></div>
    </div>
  </div>

  <h2>Detalle de Consumos</h2>
  <table>
    <thead>
      <tr>
        <th>Fecha</th><th>Estación</th><th>Monto</th><th>Odómetro</th><th>Notas</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <p>Flotilla Manager — Sistema de Control de Gastos</p>
  </div>

  <div class="print-btn">
    <button onclick="window.print()">🖨 Imprimir / Guardar PDF</button>
    <button class="secondary" onclick="window.close()">Cerrar</button>
  </div>
</body>
</html>`;
}

// ─── CSV ───────────────────────────────────────────────────────────────────
function buildCSV({ expenses, cycleLabel, totalSpent }) {
  const header = ["Fecha", "Estación", "Monto", "Odómetro (km)", "Notas"].join(",");
  const rows = expenses.map((exp) =>
    [
      format(new Date(exp.date), "dd/MM/yyyy"),
      `"${(exp.stationName || exp.station_name || "").replace(/"/g, '""')}"`,
      exp.amount,
      exp.odometer || "",
      `"${(exp.notes || "").replace(/"/g, '""')}"`,
    ].join(",")
  );
  const footer = [`\nTotal,,,${totalSpent}`];
  return [header, ...rows, ...footer].join("\n");
}

// ─── Exportar PDF ─────────────────────────────────────────────────────────
async function exportPDF(data) {
  const html = buildReportHTML(data);

  if (isNative()) {
    // En Android: guarda el HTML en un archivo temporal y comparte con Share nativo
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");

      const fileName = `flotilla-reporte-${data.cycleLabel.replace(/\s/g, "-")}.html`;

      await Filesystem.writeFile({
        path: fileName,
        data: html,
        directory: Directory.Cache,
        encoding: "utf8",
      });

      const { uri } = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache,
      });

      await Share.share({
        title: `Reporte ${data.cycleLabel}`,
        text: `Reporte de consumo Flotilla Manager — ${data.cycleLabel}`,
        url: uri,
        dialogTitle: "Exportar Reporte",
      });
    } catch (err) {
      console.error("Error exportando PDF nativo:", err);
      // Fallback: intenta abrir en el navegador del sistema
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url  = URL.createObjectURL(blob);
      window.open(url, "_system"); // _system abre el navegador externo en Capacitor
    }
  } else {
    // En web: abre en nueva pestaña como siempre
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      // Popup bloqueado — descarga como .html
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      triggerDownload(blob, `reporte-${data.cycleLabel}.html`);
    }
  }
}

// ─── Exportar CSV ─────────────────────────────────────────────────────────
async function exportCSV(data) {
  const csv      = buildCSV(data);
  const fileName = `flotilla-reporte-${data.cycleLabel.replace(/\s/g, "-")}.csv`;

  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");

      await Filesystem.writeFile({
        path: fileName,
        data: csv,
        directory: Directory.Cache,
        encoding: "utf8",
      });

      const { uri } = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Cache,
      });

      await Share.share({
        title: `Reporte CSV ${data.cycleLabel}`,
        url: uri,
        dialogTitle: "Exportar CSV",
      });
    } catch (err) {
      console.error("Error exportando CSV nativo:", err);
    }
  } else {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, fileName);
  }
}

function triggerDownload(blob, filename) {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href  = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Componente ───────────────────────────────────────────────────────────
export default function ExportReport({ expenses, cycleLabel, totalSpent, config }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null); // "pdf" | "csv" | null

  const data = { expenses, cycleLabel, totalSpent, config };

  const handlePDF = async () => {
    setLoading("pdf");
    setOpen(false);
    try {
      await exportPDF(data);
    } finally {
      setLoading(null);
    }
  };

  const handleCSV = async () => {
    setLoading("csv");
    setOpen(false);
    try {
      await exportCSV(data);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative inline-block">
      <Button
        onClick={() => setOpen((v) => !v)}
        variant="outline"
        disabled={!!loading}
        className="h-11 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <FileDown className="w-4 h-4 mr-2" />
        {loading ? "Exportando…" : "Exportar"}
        <ChevronDown className="w-3 h-3 ml-1" />
      </Button>

      {open && (
        <>
          {/* Overlay para cerrar al tocar fuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-12 z-20 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-[160px]">
            <button
              onClick={handlePDF}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-red-500" />
              PDF / HTML
            </button>
            <button
              onClick={handleCSV}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border-t border-gray-100"
            >
              <FileDown className="w-4 h-4 text-emerald-500" />
              CSV (Excel)
            </button>
          </div>
        </>
      )}
    </div>
  );
}