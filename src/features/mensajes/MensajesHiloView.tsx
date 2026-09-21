"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button, EmptyState, Spinner, TextField } from "@/components/ui";
import { getUserId } from "@/features/servicios/session";
import {
  enviarMensaje,
  fetchMensajes,
  MensajeApiError,
} from "./api";
import type { Mensaje } from "./types";

export type MensajesHiloViewProps = {
  idServicio: number;
};

const AUTO_REFRESH_MS = 4000;

function formatearHora(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function MensajesHiloView({ idServicio }: MensajesHiloViewProps) {
  const idSesion = getUserId();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);

  const cargar = useCallback(
    async (mostrarCarga = true) => {
      if (idSesion == null) {
        setError("No hay sesión activa");
        setCargando(false);
        return;
      }
      if (mostrarCarga) {
        setCargando(true);
        setError(null);
      }
      try {
        const list = await fetchMensajes(idServicio, idSesion);
        setMensajes(list);
        setError(null);
      } catch (e) {
        const msg =
          e instanceof MensajeApiError
            ? e.body || e.message
            : "Error de conexión";
        if (mostrarCarga) setError(msg);
      } finally {
        setCargando(false);
      }
    },
    [idServicio, idSesion],
  );

  useEffect(() => {
    void cargar(true);
    const t = window.setInterval(() => {
      void cargar(false);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes]);

  async function onEnviar(e: FormEvent) {
    e.preventDefault();
    if (idSesion == null || enviando) return;
    const trimmed = texto.trim();
    if (!trimmed) return;
    setEnviando(true);
    try {
      const nuevo = await enviarMensaje(idServicio, idSesion, trimmed);
      setMensajes((prev) => [...prev, nuevo]);
      setTexto("");
    } catch (err) {
      const msg =
        err instanceof MensajeApiError
          ? err.body || err.message
          : "No se pudo enviar";
      setError(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-2xl flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--gopoli-border,#E0E0E0)] px-4 py-3 md:px-6">
        <div>
          <h1 className="text-lg font-bold text-[var(--gopoli-primary,#1B5E20)]">
            Chat del grupo
          </h1>
          <p className="text-xs text-[var(--gopoli-text-muted,#757575)]">
            Servicio #{idServicio}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/grupo/${idServicio}`}
            className="text-sm font-medium text-[var(--gopoli-primary,#1B5E20)] underline-offset-2 hover:underline"
          >
            Ver grupo
          </Link>
          <Link
            href="/mensajes"
            className="text-sm text-[var(--gopoli-text-muted,#757575)] underline-offset-2 hover:underline"
          >
            Volver
          </Link>
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner label="Cargando mensajes…" />
        </div>
      ) : error && mensajes.length === 0 ? (
        <EmptyState
          title={error}
          action={
            <Button onClick={() => void cargar(true)}>Reintentar</Button>
          }
        />
      ) : (
        <>
          <div
            ref={listaRef}
            className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6"
          >
            {mensajes.length === 0 ? (
              <EmptyState
                title="Aún no hay mensajes"
                description="Escribe algo para coordinar con tu grupo."
              />
            ) : (
              mensajes.map((m) => {
                const mio = m.idUsuario === idSesion;
                return (
                  <div
                    key={m.idMensaje}
                    className={[
                      "flex",
                      mio ? "justify-end" : "justify-start",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                        mio
                          ? "bg-[var(--gopoli-primary,#1B5E20)] text-white"
                          : "bg-[#F5F5F5] text-[var(--foreground,#171717)]",
                      ].join(" ")}
                    >
                      {!mio ? (
                        <p
                          className={[
                            "mb-0.5 text-[11px] font-semibold",
                            mio
                              ? "text-white/80"
                              : "text-[var(--gopoli-primary,#1B5E20)]",
                          ].join(" ")}
                        >
                          {m.nombreUsuario ?? "Usuario"}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap break-words text-sm leading-snug">
                        {m.texto}
                      </p>
                      <p
                        className={[
                          "mt-1 text-right text-[10px]",
                          mio
                            ? "text-white/70"
                            : "text-[var(--gopoli-text-muted,#757575)]",
                        ].join(" ")}
                      >
                        {formatearHora(m.fechaEnvio)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {error && mensajes.length > 0 ? (
            <p className="px-4 text-sm text-red-600 md:px-6" role="alert">
              {error}
            </p>
          ) : null}

          <form
            onSubmit={(e) => void onEnviar(e)}
            className="flex items-end gap-2 border-t border-[var(--gopoli-border,#E0E0E0)] p-4 md:p-6"
          >
            <div className="min-w-0 flex-1">
              <TextField
                aria-label="Escribe un mensaje"
                placeholder="Escribe un mensaje…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={1000}
                disabled={enviando || idSesion == null}
                fullWidth
              />
            </div>
            <Button
              type="submit"
              disabled={enviando || !texto.trim() || idSesion == null}
            >
              {enviando ? "…" : "Enviar"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
