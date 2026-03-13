import React from "react";
import { motion } from "framer-motion";
import { Fuel, TrendingDown, Calendar, AlertTriangle } from "lucide-react";
import { formatMoney } from "@/utils";

function CircularProgress({ percentage, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (pct) => {
    if (pct >= 90) return "#EF4444";
    if (pct >= 70) return "#F59E0B";
    return "#10B981";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(percentage)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">
          {Math.round(percentage)}%
        </span>
        <span className="text-[10px] text-white/60 uppercase tracking-wider">
          Usado
        </span>
      </div>
    </div>
  );
}

export default function BalanceCard({
  config,
  totalSpent,
  isCardBlocked,
  cycleLabel,
}) {
  const limit = config?.monthly_limit || 10000;
  const remaining = Math.max(0, limit - totalSpent);
  const percentage = Math.min(100, (totalSpent / limit) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl mx-4"
      style={{
        background:
          "linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 50%, #1C1C1E 100%)",
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/10 -translate-y-10 translate-x-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-emerald-500/5 translate-y-10 -translate-x-10" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Fuel className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-white/40 uppercase tracking-widest font-medium">
                TotalEnergies
              </p>
              <p className="text-sm text-white/80 font-medium">
                {config?.card_name || "Tarjeta Flotilla"}
              </p>
            </div>
          </div>
          {isCardBlocked && (
            <div className="flex items-center gap-1.5 bg-red-500/20 rounded-full px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] text-red-400 font-semibold">
                En Corte
              </span>
            </div>
          )}
        </div>

        {/* Balance & Progress */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">
              Disponible
            </p>
            <motion.p
              key={remaining}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-4"
            >
              {formatMoney(remaining)}
            </motion.p>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-white/50">Gastado:</span>
                <span className="text-xs text-white/80 font-semibold">
                  {formatMoney(totalSpent)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-white/50">Ciclo:</span>
                <span className="text-xs text-white/80 font-semibold">
                  {cycleLabel}
                </span>
              </div>
            </div>
          </div>

          <CircularProgress percentage={percentage} />
        </div>

        {/* Usage bar */}
        <div className="mt-5">
          <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
            <span>RD$0</span>
            <span>{formatMoney(limit)}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  percentage >= 90
                    ? "linear-gradient(90deg, #F59E0B, #EF4444)"
                    : percentage >= 70
                      ? "linear-gradient(90deg, #10B981, #F59E0B)"
                      : "linear-gradient(90deg, #10B981, #34D399)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
