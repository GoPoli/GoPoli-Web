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

type ConsultaEstadoViajes =
  | { tipo: "sin-sesion" }
  | { tipo: "error"; mensaje: string }
  | {
      tipo: "ok";
      idServicioActivo: number | null;
      idServicioEnCurso: number | null;
    };

async function consultarEstadoViajes(): Promise<ConsultaEstadoViajes> {
  const idUsuario = getUserId();
  if (idUsuario == null) {
    return { tipo: "sin-sesion" };
  }
  try {
    const [activo, enCurso] = await Promise.all([
      fetchIdServicioActivoUsuario(idUsuario),
      fetchServicioEnCurso(idUsuario),
    ]);
    return {
      tipo: "ok",
      idServicioActivo: activo,
      idServicioEnCurso: enCurso?.idServicio ?? null,
    };
  } catch (e) {
    return {
      tipo: "error",
      mensaje: e instanceof Error ? e.message : "Error al cargar viajes",
    };
  }
}

/** Estado de grupo en planificación + viaje en curso (como Flutter Home/Viajes/Mapa). */
export function useEstadoViajesUsuario(): EstadoViajesUsuario {
  const [idServicioActivo, setIdServicioActivo] = useState<number | null>(null);
  const [idServicioEnCurso, setIdServicioEnCurso] = useState<number | null>(
    null,
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aplicar = useCallback((consulta: ConsultaEstadoViajes) => {
    if (consulta.tipo === "ok") {
      setIdServicioActivo(consulta.idServicioActivo);
      setIdServicioEnCurso(consulta.idServicioEnCurso);
      setError(null);
    } else if (consulta.tipo === "sin-sesion") {
      setIdServicioActivo(null);
      setIdServicioEnCurso(null);
      setError("No hay sesión activa");
    } else {
      setError(consulta.mensaje);
    }
    setCargando(false);
  }, []);

  const refrescar = useCallback(() => {
    if (getUserId() != null) {
      setCargando(true);
      setError(null);
    }
    return consultarEstadoViajes().then(aplicar);
  }, [aplicar]);

  useEffect(() => {
    void consultarEstadoViajes().then(aplicar);
    return subscribeSession(() => {
      void refrescar();
    });
  }, [aplicar, refrescar]);

  return {
    idServicioActivo,
    idServicioEnCurso,
    cargando,
    error,
    refrescar,
  };
}
