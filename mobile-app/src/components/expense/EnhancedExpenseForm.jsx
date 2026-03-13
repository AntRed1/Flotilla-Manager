import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, Loader2, MapPin, Image } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getCurrentCycleId } from "@/utils";

// Convierte base64 a File para enviarlo al backend igual que antes
function base64ToFile(base64, filename = 'receipt.jpg', mimeType = 'image/jpeg') {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new File([ab], filename, { type: mimeType });
}

export default function EnhancedExpenseForm({ onSuccess, initialData }) {
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState(
    initialData?.receiptUrl || null
  );
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  // ¿Corriendo dentro de Capacitor nativo?
  const isNative = typeof window !== 'undefined' &&
    window?.Capacitor?.isNativePlatform?.() === true;

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount:     initialData?.amount || "",
      date:       initialData?.date
        ? format(new Date(initialData.date + 'T00:00:00'), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      station_id: initialData?.stationId?.toString() || "",
      notes:      initialData?.notes || "",
    },
  });

  const { data: stations = [], isLoading: stationsLoading } = useQuery({
    queryKey: ["stations"],
    queryFn: () => apiClient.getStations(),
  });

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: () => apiClient.getConfig(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Gasto registrado correctamente");
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message || "Error al registrar el gasto"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Gasto actualizado correctamente");
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message || "Error al actualizar el gasto"),
  });

  // ── Cámara nativa — import dinámico DENTRO de la función (no top-level) ──
  const handleNativeCamera = async (sourceType) => {
    try {
      // Import dinámico solo cuando se necesita — evita top-level await
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const source = sourceType === 'photos' ? CameraSource.Photos : CameraSource.Camera;

      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source,
        quality: 80,
        width: 1200,
        correctOrientation: true,
      });

      const mimeType = `image/${photo.format}`;
      const file = base64ToFile(photo.base64String, `receipt.${photo.format}`, mimeType);
      setImageFile(file);
      setImagePreview(`data:${mimeType};base64,${photo.base64String}`);
    } catch (err) {
      if (err?.message !== 'User cancelled photos app') {
        toast.error("No se pudo acceder a la cámara");
      }
    }
  };

  // ── Fallback web ──────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen válida");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es demasiado grande (máx. 5MB)");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (formData) => {
    const now = new Date();
    const [year, month, day] = formData.date.split("-").map(Number);
    const localDatetime = `${String(year).padStart(4,"0")}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}T${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;

    const data = {
      ...formData,
      amount:     parseFloat(formData.amount),
      station_id: formData.station_id ? parseInt(formData.station_id) : null,
      cycle_id:   getCurrentCycleId(),
      receipt:    imageFile,
      date:       localDatetime,
    };

    if (initialData?.id) {
      updateMutation.mutate({ id: initialData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const stationsByZone = stations.reduce((acc, s) => {
    const zone = s.zone || "Sin zona";
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(s);
    return acc;
  }, {});
  const zones = Object.keys(stationsByZone).sort();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Monto */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-base font-medium">
          Monto <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">RD$</span>
          <Input
            id="amount" type="number" step="0.01" placeholder="0.00"
            className="pl-12 text-lg h-12"
            {...register("amount", {
              required: "El monto es requerido",
              min: { value: 0.01, message: "El monto debe ser mayor a 0" },
              max: {
                value: config?.monthlyLimit || 10000,
                message: `El monto no puede exceder RD$${config?.monthlyLimit || 10000}`,
              },
            })}
          />
        </div>
        {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
      </div>

      {/* Fecha */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-base font-medium">
          Fecha <span className="text-red-500">*</span>
        </Label>
        <Input id="date" type="date" className="h-12"
          {...register("date", { required: "La fecha es requerida" })} />
        {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
      </div>

      {/* Gasolinera */}
      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Gasolinera
        </Label>
        {stationsLoading ? (
          <div className="h-12 rounded-lg border bg-muted animate-pulse" />
        ) : (
          <Select value={watch("station_id")} onValueChange={(v) => setValue("station_id", v)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecciona una gasolinera" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {zones.map((zone) => (
                <div key={zone}>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">{zone}</div>
                  {stationsByZone[zone].map((station) => (
                    <SelectItem key={station.id} value={station.id.toString()} className="pl-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{station.name}</span>
                        {station.address && (
                          <span className="text-xs text-muted-foreground">{station.address}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Comprobante */}
      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center gap-2">
          <Camera className="w-4 h-4" /> Comprobante de pago
        </Label>

        {imagePreview ? (
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <img src={imagePreview} alt="Vista previa"
                  className="w-full h-48 object-cover rounded-lg" />
                <Button type="button" variant="destructive" size="icon"
                  className="absolute top-2 right-2" onClick={handleRemoveImage}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isNative ? (
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="h-20 flex-col gap-2"
              onClick={() => handleNativeCamera('camera')}>
              <Camera className="w-6 h-6" />
              <span className="text-xs">Tomar foto</span>
            </Button>
            <Button type="button" variant="outline" className="h-20 flex-col gap-2"
              onClick={() => handleNativeCamera('photos')}>
              <Image className="w-6 h-6" />
              <span className="text-xs">Desde galería</span>
            </Button>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Toca para seleccionar una foto</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP (máx. 5MB)</p>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*"
          capture="environment" onChange={handleFileChange} className="hidden" />
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base font-medium">Notas (opcional)</Label>
        <Textarea id="notes" placeholder="Agrega notas adicionales..." rows={3} {...register("notes")} />
      </div>

      <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
        {isSubmitting
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
          : <>{initialData ? "Actualizar Gasto" : "Registrar Gasto"}</>
        }
      </Button>
    </form>
  );
}