// src/components/analytics/GlobalKPIs.jsx
import React from "react";
import { motion } from "framer-motion";
import { Fuel, BarChart2, TrendingUp, Star } from "lucide-react";
import { formatMoney } from "@/utils";

export default function GlobalKPIs({ summary }) {
  if (!summary) return null;

  const kpis = [
    {
      label: "Total Histórico",
      value: formatMoney(summary.totalHistorical),
      icon: Fuel,
      color: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      label: "Promedio Mensual",
      value: formatMoney(summary.monthlyAverage),
      icon: TrendingUp,
      color: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      label: "Transacciones",
      value: summary.totalTransactions,
      icon: BarChart2,
      color: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      label: "Estación Top",
      value: summary.topStationName
        ? summary.topStationName.replace("TotalEnergies ", "")
        : "—",
      icon: Star,
      color: "bg-orange-500/10",
      iconColor: "text-orange-500",
      small: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <div className={`w-9 h-9 ${kpi.color} rounded-xl flex items-center justify-center mb-3`}>
            <kpi.icon className={`w-4.5 h-4.5 ${kpi.iconColor}`} />
          </div>
          <p className={`font-bold text-gray-900 leading-tight ${kpi.small ? "text-sm" : "text-lg"}`}>
            {kpi.value}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{kpi.label}</p>
        </motion.div>
      ))}
    </div>
  );
}