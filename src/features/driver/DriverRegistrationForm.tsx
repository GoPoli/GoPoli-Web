"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, TextField } from "@/components/ui";
import { registerAsDriver } from "@/features/profile/api";
import { ApiError, FieldValidationError } from "@/lib/api/client";
import { validateVehicle, type VehicleFieldErrors } from "./validators";

export function DriverRegistrationForm() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [plate, setPlate] = useState("");
  const [errors, setErrors] = useState<VehicleFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const local = validateVehicle({ brand, model, color, plate });
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    setSubmitting(true);
    try {
      await registerAsDriver({ brand, model, color, plate });
      router.push("/profile");
      router.refresh();
    } catch (err) {
      if (err instanceof FieldValidationError) {
        setErrors(err.fieldErrors as VehicleFieldErrors);
      } else if (err instanceof ApiError) {
        setToast(err.message);
      } else {
        setToast("No se pudo completar el registro");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto w-full max-w-lg space-y-4 px-4 pb-28 pt-4 md:pb-10">
      <p className="text-sm leading-relaxed text-[var(--gopoli-text-muted,#757575)]">
        Completa los datos de tu vehículo para ser conductor en GoPoli.
      </p>

      {toast ? (
        <div role="alert" className="rounded-lg bg-red-700 px-4 py-3 text-sm text-white">
          {toast}
        </div>
      ) : null}

      <TextField
        label="Marca *"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        disabled={submitting}
        error={errors.brand}
        autoComplete="off"
      />
      <TextField
        label="Modelo *"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        disabled={submitting}
        error={errors.model}
        autoComplete="off"
      />
      <TextField
        label="Color *"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        disabled={submitting}
        error={errors.color}
        autoComplete="off"
      />
      <TextField
        label="Placa *"
        value={plate}
        onChange={(e) => setPlate(e.target.value.toUpperCase())}
        disabled={submitting}
        error={errors.plate}
        autoComplete="off"
        className="uppercase"
      />

      <Button type="submit" fullWidth loading={submitting}>
        Registrarme como conductor
      </Button>
    </form>
  );
}
