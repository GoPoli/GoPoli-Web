"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, TextField } from "@/components/ui";
import { registerAsDriver } from "@/features/perfil/api";
import {
  ApiException,
  FieldValidationException,
} from "@/features/perfil/errors";
import {
  validarVehiculo,
  type ConductorFieldErrors,
} from "./validators";

export function RegistroConductorForm() {
  const router = useRouter();
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [color, setColor] = useState("");
  const [placa, setPlaca] = useState("");
  const [errores, setErrores] = useState<ConductorFieldErrors>({});
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const local = validarVehiculo({ marca, modelo, color, placa });
    setErrores(local);
    if (Object.keys(local).length > 0) return;

    setEnviando(true);
    try {
      await registerAsDriver({ marca, modelo, color, placa });
      router.push("/perfil");
      router.refresh();
    } catch (err) {
      if (err instanceof FieldValidationException) {
        setErrores(err.fieldErrors as ConductorFieldErrors);
      } else if (err instanceof ApiException) {
        setToast(err.message);
      } else {
        setToast("No se pudo completar el registro");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto w-full max-w-lg space-y-4 px-4 pb-28 pt-4 md:pb-10"
    >
      <p className="text-sm leading-relaxed text-[var(--gopoli-text-muted,#757575)]">
        Completa los datos de tu vehículo para ser conductor en GoPoli.
      </p>

      {toast ? (
        <div
          role="alert"
          className="rounded-lg bg-red-700 px-4 py-3 text-sm text-white"
        >
          {toast}
        </div>
      ) : null}

      <TextField
        label="Marca *"
        value={marca}
        onChange={(e) => setMarca(e.target.value)}
        disabled={enviando}
        error={errores.marca}
        autoComplete="off"
      />
      <TextField
        label="Modelo *"
        value={modelo}
        onChange={(e) => setModelo(e.target.value)}
        disabled={enviando}
        error={errores.modelo}
        autoComplete="off"
      />
      <TextField
        label="Color *"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        disabled={enviando}
        error={errores.color}
        autoComplete="off"
      />
      <TextField
        label="Placa *"
        value={placa}
        onChange={(e) => setPlaca(e.target.value.toUpperCase())}
        disabled={enviando}
        error={errores.placa}
        autoComplete="off"
        className="uppercase"
      />

      <Button type="submit" fullWidth loading={enviando}>
        Registrarme como conductor
      </Button>
    </form>
  );
}
