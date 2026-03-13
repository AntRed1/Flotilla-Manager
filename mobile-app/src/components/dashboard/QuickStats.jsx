import React from "react";
import { motion } from "framer-motion";
import { Receipt, Fuel, CalendarClock, Lock } from "lucide-react";
import { formatMoney } from "@/utils";

export default function QuickStats({
  totalTransactions,
  averagePerTransaction,
  daysUntilCutoff,
  cardBlocked = false,
}) {
  const stats = [
    {
      label: "Transacciones",
      value: totalTransactions,
      icon: Receipt,
      color: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      label: "Promedio",
      value: formatMoney(averagePerTransaction),
      icon: Fuel,
      color: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      // ✅ Label dinámico según estado de la tarjeta
      label: cardBlocked ? "Días p/ Recarga" : "Días p/ Corte",
      value: daysUntilCutoff >= 0 ? daysUntilCutoff : "—",
      icon: cardBlocked ? Lock : CalendarClock,
      color: cardBlocked ? "bg-red-500/10" : "bg-orange-500/10",
      iconColor: cardBlocked ? "text-red-500" : "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 * index }}
          className="bg-white rounded-2xl p-3.5 text-center shadow-sm"
        >
          <div
            className={`w-9 h-9 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}
          >
            <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
          </div>
          <p className="text-lg font-bold text-gray-900">{stat.value}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}