// @ts-ignore
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/apiClient";
import { Plus, MapPin, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

export default function StationManager({ stations, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newZone, setNewZone] = useState("");
  const [newProvince, setNewProvince] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.createStation({
        name: newName.trim(),
        address: newAddress.trim(),
        zone: newZone.trim() || "Zona General", // Default value if empty
        province: newProvince.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Estación agregada");
      setNewName("");
      setNewAddress("");
      setNewZone("");
      setNewProvince("");
      setShowForm(false);
      onRefresh?.();
    },
    onError: (error) => {
      toast.error(error.message || "Error al agregar estación");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteStation(id),
    onSuccess: () => {
      toast.success("Estación eliminada");
      onRefresh?.();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar estación");
    },
  });

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error("Ingresa el nombre de la estación");
      return;
    }
    if (!newAddress.trim()) {
      toast.error("Ingresa la dirección de la estación");
      return;
    }
    createMutation.mutate();
  };

  // Common zones for quick selection
  const commonZones = [
    "Distrito Nacional",
    "Santo Domingo Este",
    "Santo Domingo Oeste",
    "Santo Domingo Norte",
    "Zona Este",
    "Zona Sur",
    "Zona Norte",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">Estaciones</h3>
        </div>
        <
// @ts-ignore
        Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-emerald-600 hover:bg-emerald-50"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <Input
                // @ts-ignore
                placeholder="Nombre de estación *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-11 border-0 bg-gray-50 rounded-xl focus-visible:ring-emerald-500"
              />
              <Input
                // @ts-ignore
                placeholder="Dirección *"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="h-11 border-0 bg-gray-50 rounded-xl focus-visible:ring-emerald-500"
              />

              {/* Zone selection */}
              <div className="space-y-2">
                <select
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  className="w-full h-11 px-3 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                >
                  <option value="">Seleccionar zona</option>
                  {commonZones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                  <option value="custom">Otra zona...</option>
                </select>

                {newZone === "custom" && (
                  <Input
                    // @ts-ignore
                    placeholder="Nombre de la zona personalizada"
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className="h-11 border-0 bg-gray-50 rounded-xl focus-visible:ring-emerald-500"
                  />
                )}
              </div>

              <Input
                // @ts-ignore
                placeholder="Provincia (opcional)"
                value={newProvince}
                onChange={(e) => setNewProvince(e.target.value)}
                className="h-11 border-0 bg-gray-50 rounded-xl focus-visible:ring-emerald-500"
              />

              <
// @ts-ignore
              Button
                onClick={handleAdd}
                disabled={createMutation.isPending}
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {createMutation.isPending ? "Agregando..." : "Agregar Estación"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
        {stations.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">
              No hay estaciones registradas
            </p>
          </div>
        )}
        {stations.map((station) => (
          <div key={station.id} className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {station.name}
              </p>
              {station.address && (
                <p className="text-xs text-gray-400 truncate">
                  {station.address}
                </p>
              )}
              {station.zone && (
                <p className="text-xs text-blue-500 truncate">
                  {station.zone}
                  {station.province && ` • ${station.province}`}
                </p>
              )}
            </div>
            <
// @ts-ignore
            Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(station.id)}
              className="text-gray-300 hover:text-red-500 hover:bg-red-50 h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
