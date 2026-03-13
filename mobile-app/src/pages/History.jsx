// src/pages/History.jsx
import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/apiClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import ExpenseList from "@/components/history/ExpenseList";
import HistoryFilters from "@/components/history/HistoryFilters";
import ExportReport from "@/components/shared/ExportReport";
import PullToRefresh from "@/components/shared/PullToRefresh";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { getCurrentCycleId, generateCycleOptions, formatMoney } from "@/utils";
import { toast } from "sonner";

export default function History() {
  const [selectedCycle, setSelectedCycle] = useState(getCurrentCycleId());
  const [searchQuery, setSearchQuery]       = useState("");
  const [selectedStation, setSelectedStation] = useState("all");
  const [minAmount, setMinAmount]           = useState("");
  const [maxAmount, setMaxAmount]           = useState("");
  const [deleteId, setDeleteId]             = useState(null);

  const queryClient  = useQueryClient();
  const cycleOptions = useMemo(() => generateCycleOptions(), []);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["expenses"] });
    await queryClient.invalidateQueries({ queryKey: ["config"] });
    await queryClient.invalidateQueries({ queryKey: ["stations"] });
  };

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", selectedCycle],
    queryFn: () => apiClient.getExpenses({ cycle_id: selectedCycle }),
    initialData: [],
  });

  const { data: stations = [] } = useQuery({
    queryKey: ["stations"],
    queryFn: () => apiClient.getStations(),
    initialData: [],
  });

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: () => apiClient.getConfig(),
    initialData: {},
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", selectedCycle] });
      toast.success("Gasto eliminado correctamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar el gasto");
    },
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // ✅ camelCase — coincide con lo que devuelve el backend
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchStation = exp.stationName?.toLowerCase().includes(q);
        const matchNotes   = exp.notes?.toLowerCase().includes(q);
        if (!matchStation && !matchNotes) return false;
      }
      if (
        selectedStation !== "all" &&
        exp.stationId?.toString() !== selectedStation
      ) return false;
      if (minAmount && Number(exp.amount) < parseFloat(minAmount)) return false;
      if (maxAmount && Number(exp.amount) > parseFloat(maxAmount)) return false;
      return true;
    });
  }, [expenses, searchQuery, selectedStation, minAmount, maxAmount]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStation("all");
    setMinAmount("");
    setMaxAmount("");
  };

  const cycleLabel = cycleOptions.find((opt) => opt.id === selectedCycle)?.label ?? "";

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="px-4 pt-2 pb-24">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
          <p className="text-sm text-gray-400 mt-1">Consulta consumos por ciclo</p>
        </div>

        {/* Selector de ciclo + total */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="border-0 bg-transparent h-auto p-0 w-auto gap-2 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cycleOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900">
                {formatMoney(totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros — ocupa todo el ancho */}
        <HistoryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStation={selectedStation}
          onStationChange={setSelectedStation}
          minAmount={minAmount}
          onMinAmountChange={setMinAmount}
          maxAmount={maxAmount}
          onMaxAmountChange={setMaxAmount}
          stations={stations}
          onClear={clearFilters}
        />

        {/* Exportar — botón separado debajo de los filtros */}
        <div className="mt-3 mb-4">
          <ExportReport
            expenses={filteredExpenses}
            cycleLabel={cycleLabel}
            totalSpent={totalSpent}
            config={config}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <ExpenseList
            expenses={filteredExpenses}
            onDelete={(id) => setDeleteId(id)}
          />
        )}

        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={() => setDeleteId(null)}
          onConfirm={() => deleteMutation.mutateAsync(deleteId)}
          title="¿Eliminar consumo?"
          description="Esta acción no se puede deshacer. El registro será eliminado permanentemente."
          confirmText="Eliminar"
        />
      </div>
    </PullToRefresh>
  );
}