// src/components/analytics/CycleComparison.jsx
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatMoney } from "@/utils";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-gray-900 text-white rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold">{d.label}</p>
        <p className="text-white/80 mt-0.5">{formatMoney(d.total)}</p>
        <p className="text-white/50">{d.count} consumos</p>
      </div>
    );
  }
  return null;
};

export default function CycleComparison({ data }) {
  // data = CyclesReport del backend
  const cycles = data.cycles ?? [];
  const current = cycles[0];
  const previous = cycles[1];

  const diff = current && previous
    ? Number(current.total) - Number(previous.total)
    : 0;
  const diffPct = previous && Number(previous.total) > 0
    ? (diff / Number(previous.total)) * 100
    : 0;

  const chartData = cycles.map((c, idx) => ({
    ...c,
    total: Number(c.total),
    fill: idx === 0 ? "#10B981" : "#E5E7EB",
  }));

  const TrendIcon = diff === 0 ? Minus : diff > 0 ? TrendingUp : TrendingDown;
  const trendColor = diff === 0 ? "text-gray-500" : diff > 0 ? "text-red-500" : "text-green-500";
  const trendBg   = diff === 0 ? "bg-gray-50" : diff > 0 ? "bg-red-50" : "bg-green-50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-5"
    >
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Comparativa de Ciclos
      </h3>

      {current && previous && (
        <div className="mb-5 p-4 bg-gray-50 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Cambio vs ciclo anterior</p>
            <p className="text-xl font-bold text-gray-900">
              {formatMoney(Math.abs(diff))}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${trendBg}`}>
            <TrendIcon className={`w-5 h-5 ${trendColor}`} />
            <span className={`text-sm font-bold ${trendColor}`}>
              {Math.abs(diffPct).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Grid de los 2 últimos ciclos */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {cycles.slice(0, 2).map((c, idx) => (
          <div
            key={c.cycleId}
            className={`p-3 rounded-xl ${idx === 0 ? "bg-emerald-50" : "bg-gray-50"}`}
          >
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-sm font-bold text-gray-900">{formatMoney(c.total)}</p>
            <p className="text-xs text-gray-400 mt-1">{c.count} consumos</p>
            {Number(c.total) > 0 && (
              <p className="text-xs text-gray-400">
                Prom: {formatMoney(c.average)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Indicadores de mejor/peor ciclo */}
      {data.bestCycleId && data.worstCycleId && data.bestCycleId !== data.worstCycleId && (
        <div className="mt-3 flex gap-2">
          <div className="flex-1 bg-green-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Menor gasto</p>
            <p className="text-xs font-bold text-green-600 mt-0.5">
              {cycles.find(c => c.cycleId === data.bestCycleId)?.label ?? data.bestCycleId}
            </p>
          </div>
          <div className="flex-1 bg-red-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Mayor gasto</p>
            <p className="text-xs font-bold text-red-600 mt-0.5">
              {cycles.find(c => c.cycleId === data.worstCycleId)?.label ?? data.worstCycleId}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}