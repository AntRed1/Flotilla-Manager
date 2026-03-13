import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/api/apiClient";
import { Save, CreditCard, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

export default function CardConfigForm({ config, onSave }) {
  const [form, setForm] = useState({
    cardName: "Tarjeta Flotilla TotalEnergies",
    monthlyLimit: 10000,
    cutoffStartDay: 29,
    cutoffEndDay: 2,
    rechargeDay: 3,
    currency: "DOP",
  });

  useEffect(() => {
    if (config) {
      setForm({
        // ✅ camelCase — coincide con lo que devuelve el backend
        cardName:        config.cardName        ?? "Tarjeta Flotilla TotalEnergies",
        monthlyLimit:    config.monthlyLimit     ?? 10000,
        cutoffStartDay:  config.cutoffStartDay   ?? 29,
        cutoffEndDay:    config.cutoffEndDay      ?? 2,
        rechargeDay:     config.rechargeDay       ?? 3,
        currency:        config.currency          ?? "DOP",
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: () => apiClient.updateConfig({
      // ✅ El backend recibe ConfigRequest.Update con camelCase en JSON
      cardName:       form.cardName,
      monthlyLimit:   parseFloat(form.monthlyLimit),
      cutoffStartDay: parseInt(form.cutoffStartDay),
      cutoffEndDay:   parseInt(form.cutoffEndDay),
      rechargeDay:    parseInt(form.rechargeDay),
      currency:       form.currency,
    }),
    onSuccess: () => {
      toast.success("Configuración guardada");
      onSave?.();
    },
    onError: (error) => {
      toast.error(error.message || "Error al guardar configuración");
    },
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 mb-2">
          <CreditCard className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold text-gray-900">Tarjeta</h3>
        </div>
        <div>
          <Label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
            Nombre
          </Label>
          <Input
            value={form.cardName}
            onChange={(e) => handleChange("cardName", e.target.value)}
            className="h-12 border-0 bg-gray-50 rounded-xl focus-visible:ring-emerald-500"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
            Límite Mensual (RD$)
          </Label>
          <Input
            type="number"
            value={form.monthlyLimit}
            onChange={(e) => handleChange("monthlyLimit", e.target.value)}
            className="h-12 border-0 bg-gray-50 rounded-xl focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 mb-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-900">
            Fechas de Corte
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
              Inicio Corte
            </Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={form.cutoffStartDay}
              onChange={(e) => handleChange("cutoffStartDay", e.target.value)}
              className="h-12 border-0 bg-gray-50 rounded-xl text-center focus-visible:ring-emerald-500"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
              Fin Corte
            </Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={form.cutoffEndDay}
              onChange={(e) => handleChange("cutoffEndDay", e.target.value)}
              className="h-12 border-0 bg-gray-50 rounded-xl text-center focus-visible:ring-emerald-500"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
              Recarga
            </Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={form.rechargeDay}
              onChange={(e) => handleChange("rechargeDay", e.target.value)}
              className="h-12 border-0 bg-gray-50 rounded-xl text-center focus-visible:ring-emerald-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          La tarjeta estará inactiva del día {form.cutoffStartDay} al{" "}
          {form.cutoffEndDay} de cada mes. Se recarga el día {form.rechargeDay}.
        </p>
      </div>

      <Button
        type="submit"
        disabled={saveMutation.isPending}
        className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold shadow-lg shadow-emerald-500/25"
      >
        {saveMutation.isPending ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Guardando...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Guardar Configuración
          </div>
        )}
      </Button>
    </motion.form>
  );
}