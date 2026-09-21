"use client";

import Link from "next/link";
import { Button, Card, EmptyState, Spinner } from "@/components/ui";
import { useEstadoViajesUsuario } from "@/features/servicios";

export function MensajesInboxView() {
  const {
    idServicioActivo,
    idServicioEnCurso,
    cargando,
    error,
    refrescar,
  } = useEstadoViajesUsuario();

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Cargando mensajes…" />
      </div>
    );
  }

  const hilos: { id: number; titulo: string; descripcion: string }[] = [];
  if (idServicioEnCurso != null) {
    hilos.push({
      id: idServicioEnCurso,
      titulo: "Viaje en curso",
      descripcion: `Servicio #${idServicioEnCurso}`,
    });
  }
  if (
    idServicioActivo != null &&
    idServicioActivo !== idServicioEnCurso
  ) {
    hilos.push({
      id: idServicioActivo,
      titulo: "Mi grupo",
      descripcion: `Servicio #${idServicioActivo}`,
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <div className="mb-5 rounded-2xl border border-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_20%,transparent)] bg-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_12%,transparent)] p-[18px]">
        <h1 className="text-xl font-bold text-[var(--gopoli-primary,#1B5E20)]">
          Mensajes
        </h1>
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--gopoli-text-muted,#757575)]">
          Coordina con tu grupo: un hilo de texto por servicio activo o en curso.
        </p>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => void refrescar()}
          >
            Reintentar
          </button>
        </p>
      ) : null}

      {hilos.length === 0 ? (
        <EmptyState
          title="Sin grupos para chatear"
          description="Únete a un viaje o crea un grupo. Cuando formes parte de uno, el hilo aparecerá aquí."
          action={
            <Link href="/buscar">
              <Button>Ir a Buscar</Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {hilos.map((h) => (
            <li key={h.id}>
              <Link href={`/mensajes/${h.id}`} className="block">
                <Card className="transition-colors hover:bg-[#FAFAFA]">
                  <div className="flex items-center gap-4">
                    <span
                      className="flex size-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_15%,transparent)] text-[var(--gopoli-primary,#1B5E20)]"
                      aria-hidden
                    >
                      💬
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{h.titulo}</p>
                      <p className="text-[13px] text-[var(--gopoli-text-muted,#757575)]">
                        {h.descripcion}
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className="text-[var(--gopoli-text-muted,#757575)]"
                    >
                      ›
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => void refrescar()}>
          Actualizar
        </Button>
      </div>
    </div>
  );
}
