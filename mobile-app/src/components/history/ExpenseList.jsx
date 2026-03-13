import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Image as ImageIcon,
  FileText,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/utils";

export default function ExpenseList({ expenses, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);

  const grouped = expenses.reduce((acc, exp) => {
    // Agrupar por la fecha contable (campo date: "yyyy-MM-dd")
    const dateKey = exp.date
      ? exp.date.substring(0, 10)
      : format(new Date(), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(exp);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b) - new Date(a),
  );

  return (
    <div className="space-y-5">
      {sortedDates.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">⛽</div>
          <p className="text-gray-400 text-sm">No hay consumos registrados</p>
        </div>
      )}

      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 px-1">
            {format(new Date(dateKey + "T12:00:00"), "EEEE, d MMMM yyyy", {
              locale: es,
            })}
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {grouped[dateKey].map((expense) => (
              <motion.div key={expense.id} layout>
                <div
                  className="flex items-center gap-3.5 p-4 active:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === expense.id ? null : expense.id)
                  }
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">⛽</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* ✅ camelCase: stationName */}
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {expense.stationName || expense.station_name || "Sin estación"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {/* ✅ registeredAt viene del backend ya ajustado a UTC-4 (RD)
                            Es un LocalDateTime sin zona: "2026-03-11T17:36:00"
                            new Date() lo interpreta como local → hora correcta */}
                        {expense.registeredAt
                          ? format(new Date(expense.registeredAt), "h:mm a")
                          : "—"}
                      </span>
                      {expense.receiptUrl && (
                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                      )}
                      {expense.notes && (
                        <FileText className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">
                      {formatMoney(expense.amount)}
                    </p>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-300 transition-transform ${
                        expandedId === expense.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === expense.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {expense.odometer && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-medium">Odómetro:</span>
                            <span>{expense.odometer.toLocaleString()} km</span>
                          </div>
                        )}
                        {expense.notes && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-600">
                              {expense.notes}
                            </p>
                          </div>
                        )}
                        {expense.receiptUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceiptModal(expense.receiptUrl);
                            }}
                            className="w-full"
                          >
                            <img
                              src={expense.receiptUrl}
                              alt="Factura"
                              className="w-full h-40 object-cover rounded-xl"
                            />
                          </button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(expense.id);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={!!receiptModal} onOpenChange={() => setReceiptModal(null)}>
        <DialogContent className="max-w-sm p-2 rounded-2xl">
          <DialogTitle className="sr-only">Factura</DialogTitle>
          {receiptModal && (
            <img
              src={receiptModal}
              alt="Factura"
              className="w-full rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}