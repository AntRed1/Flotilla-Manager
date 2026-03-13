import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatMoney } from "@/utils";

// Parsea de forma segura cualquier formato de fecha que devuelva el backend
function safeParse(dateStr) {
  if (!dateStr) return null;
  try {
    // Extraer solo yyyy-MM-dd para mostrar la fecha contable
    const datePart = dateStr.substring(0, 10);
    const d = parseISO(datePart);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

export default function RecentExpenses({ expenses }) {
  const recentItems = expenses.slice(0, 5);

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">
          Consumos Recientes
        </h3>
        <Link
          to={createPageUrl("History")}
          className="text-xs text-emerald-600 font-medium flex items-center gap-0.5"
        >
          Ver todos
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
        <AnimatePresence>
          {recentItems.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-400">
                Sin consumos en este ciclo
              </p>
            </div>
          )}
          {recentItems.map((expense, index) => {
            const parsedDate = safeParse(expense.date);
            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                className="flex items-center gap-3.5 p-4 active:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⛽</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {expense.stationName || expense.station_name || "Sin estación"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {parsedDate
                        ? format(parsedDate, "d MMM, yyyy", { locale: es })
                        : "—"}
                    </span>
                    {expense.receiptImage && (
                      <ImageIcon className="w-3 h-3 text-emerald-500" />
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {formatMoney(expense.amount)}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}