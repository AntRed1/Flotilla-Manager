import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HistoryFilters({
  searchQuery,
  onSearchChange,
  selectedStation,
  onStationChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
  stations,
  onClear,
}) {
  const [expanded, setExpanded] = useState(false);

  const hasFilters =
    searchQuery || selectedStation !== "all" || minAmount || maxAmount;

  // Cuenta cuántos filtros activos hay (excluye búsqueda de texto)
  const activeFilterCount = [
    selectedStation !== "all",
    !!minAmount,
    !!maxAmount,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-0">
      {/* Header — siempre visible, toca para expandir/colapsar */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-900">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Búsqueda de texto — siempre visible */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por estación o notas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 border-0 bg-gray-50 rounded-xl focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      {/* Filtros colapsables */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="filters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Selector de estación */}
              <Select value={selectedStation} onValueChange={onStationChange}>
                <SelectTrigger className="h-11 border-0 bg-gray-50 rounded-xl focus-visible:ring-emerald-500">
                  <SelectValue placeholder="Todas las estaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las estaciones</SelectItem>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id.toString()}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Rango de montos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    RD$
                  </span>
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    value={minAmount}
                    onChange={(e) => onMinAmountChange(e.target.value)}
                    className="pl-9 h-11 border-0 bg-gray-50 rounded-xl focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    RD$
                  </span>
                  <Input
                    type="number"
                    placeholder="Máximo"
                    value={maxAmount}
                    onChange={(e) => onMaxAmountChange(e.target.value)}
                    className="pl-9 h-11 border-0 bg-gray-50 rounded-xl focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Resumen de filtros activos */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedStation !== "all" && (
                    <FilterTag
                      label={stations.find(s => s.id.toString() === selectedStation)?.name ?? "Estación"}
                      onRemove={() => onStationChange("all")}
                    />
                  )}
                  {minAmount && (
                    <FilterTag label={`≥ RD$${minAmount}`} onRemove={() => onMinAmountChange("")} />
                  )}
                  {maxAmount && (
                    <FilterTag label={`≤ RD$${maxAmount}`} onRemove={() => onMaxAmountChange("")} />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}