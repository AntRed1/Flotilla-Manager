import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { formatMoney } from "@/utils";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold">{formatMoney(payload[0].value)}</p>
        <p className="text-white/60 mt-0.5">{payload[0].payload.label}</p>
      </div>
    );
  }
  return null;
};

export default function CycleChart({ expenses, limit }) {
  const chartData = React.useMemo(() => {
    if (!expenses.length) return [];

    const sorted = [...expenses].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    let cumulative = 0;

    return sorted.map((exp) => {
      cumulative += exp.amount;
      return {
        label: format(new Date(exp.date), "d MMM", { locale: es }),
        amount: exp.amount,
        cumulative,
      };
    });
  }, [expenses]);

  if (chartData.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="px-4"
    >
      <h3 className="text-base font-semibold text-gray-900 mb-3">
        Consumo Acumulado
      </h3>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              domain={[0, limit || "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#colorCumulative)"
              dot={{ r: 3, fill: "#10B981", strokeWidth: 0 }}
              activeDot={{
                r: 5,
                fill: "#10B981",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
