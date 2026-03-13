// src/components/analytics/StationsRanking.jsx
import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { formatMoney } from "@/utils";

export default function StationsRanking({ data, cycles, selectedCycle, onCycleChange }) {
  const stations = data?.stations ?? [];
  const grandTotal = Number(data?.grandTotal ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Por Estación
        </h3>
        {/* Selector de ciclo */}
        <select
          value={selectedCycle ?? ""}
          onChange={(e) => onCycleChange(e.target.value || null)}
          className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5 border-0 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Histórico</option>
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {stations.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-400">Sin consumos en este periodo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stations.slice(0, 8).map((station, idx) => (
            <div key={station.stationId ?? idx}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-500">#{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {station.stationName ?? "Sin nombre"}
                    </p>
                    <p className="text-sm font-bold text-gray-900 ml-2 flex-shrink-0">
                      {formatMoney(station.total)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-400">
                      {station.count} consumo{station.count !== 1 ? "s" : ""}
                      {station.zone ? ` · ${station.zone}` : ""}
                    </p>
                    <p className="text-xs text-gray-400">{station.percentage}%</p>
                  </div>
                </div>
              </div>
              {/* Barra de progreso */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-10">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${station.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {grandTotal > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">Total del periodo</p>
          <p className="text-sm font-bold text-gray-900">{formatMoney(grandTotal)}</p>
        </div>
      )}
    </motion.div>
  );
}