"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeSession } from "@/features/auth/session";
import {
  fetchIdServicioActivoUsuario,
  fetchServicioEnCurso,
} from "./api";
import { getUserId } from "./session";

export type EstadoViajesUsuario = {
  idServicioActivo: number | null;
  idServicioEnCurso: number | null;
  cargando: boolean;
  error: string | null;
  refrescar: () => Promise<void>;
};

/** Estado de grupo en planificación + viaje en curso (como Flutter Home/Viajes/Mapa). */
export function useEstadoViajesUsuario(): EstadoViajesUsuario {
  const [idServicioActivo, setIdServicioActivo] = useState<number | null>(null);
  const [idServicioEnCurso, setIdServicioEnCurso] = useState<number | null>(
    null,
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    const idUsuario = getUserId();
    if (idUsuario == null) {
      setIdServicioActivo(null);
      setIdServicioEnCurso(null);
      setCargando(false);
      setError("No hay sesión activa");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const [activo, enCurso] = await Promise.all([
        fetchIdServicioActivoUsuario(idUsuario),
        fetchServicioEnCurso(idUsuario),
      ]);
      setIdServicioActivo(activo);
      setIdServicioEnCurso(enCurso?.idServicio ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar viajes");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void refrescar();
    return subscribeSession(() => {
      void refrescar();
    });
  }, [refrescar]);

  return {
    idServicioActivo,
    idServicioEnCurso,
    cargando,
    error,
    refrescar,
  };
}
