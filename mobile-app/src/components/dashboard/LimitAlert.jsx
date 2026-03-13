import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp } from "lucide-react";

export default function LimitAlert({ percentage }) {
  if (percentage < 80) return null;

  const isHighAlert = percentage >= 90;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 mb-4 rounded-2xl p-4 ${
        isHighAlert
          ? "bg-red-50 border-2 border-red-200"
          : "bg-orange-50 border-2 border-orange-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isHighAlert ? "bg-red-100" : "bg-orange-100"
          }`}
        >
          {isHighAlert ? (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          ) : (
            <TrendingUp className="w-5 h-5 text-orange-600" />
          )}
        </div>
        <div className="flex-1">
          <p
            className={`text-sm font-semibold ${isHighAlert ? "text-red-800" : "text-orange-800"}`}
          >
            {isHighAlert
              ? "⚠️ Límite Casi Alcanzado"
              : "⚡ Atención con el Gasto"}
          </p>
          <p
            className={`text-xs mt-1 ${isHighAlert ? "text-red-600" : "text-orange-600"}`}
          >
            {isHighAlert
              ? `Has gastado el ${Math.round(percentage)}% de tu límite mensual. Quedan pocos fondos disponibles.`
              : `Llevas el ${Math.round(percentage)}% de tu límite. Controla tus consumos para no quedarte sin saldo.`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
