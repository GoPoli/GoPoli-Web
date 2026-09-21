"use client";

import Link from "next/link";
import { Button, Card, EmptyState, Spinner } from "@/components/ui";
import { useEstadoViajesUsuario } from "@/features/servicios";

export function ViajesTabView() {
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
        <Spinner label="Cargando viajes…" />
      </div>
    );
  }

  const vacio = idServicioActivo == null && idServicioEnCurso == null;

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <div className="mb-5 rounded-2xl border border-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_20%,transparent)] bg-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_12%,transparent)] p-[18px]">
        <h1 className="text-xl font-bold text-[var(--gopoli-primary,#1B5E20)]">
          Viajes
        </h1>
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--gopoli-text-muted,#757575)]">
          Tu grupo en planificación, el viaje en marcha y la ruta en el mapa de
          Inicio.
        </p>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}{" "}
          <button type="button" className="underline" onClick={() => void refrescar()}>
            Reintentar
          </button>
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        {idServicioEnCurso != null ? (
          <Card padding="none" className="overflow-hidden shadow-md">
            <div className="bg-[var(--gopoli-secondary,#2E7D32)] px-4 py-3.5 text-white">
              <p className="text-lg font-bold">Viaje en curso</p>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm leading-snug text-[var(--gopoli-text-muted,#757575)]">
                La ruta está en el mapa de Inicio (salida, destino y camino).
              </p>
              <Link href={`/mapa?viaje=${idServicioEnCurso}`} className="block">
                <Button fullWidth variant="secondary">
                  Ver ruta en el mapa
                </Button>
              </Link>
              <Link href={`/grupo/${idServicioEnCurso}`} className="block">
                <Button fullWidth variant="outline">
                  Grupo: miembros y acciones
                </Button>
              </Link>
            </div>
          </Card>
        ) : null}

        {idServicioActivo != null ? (
          <Link href={`/grupo/${idServicioActivo}`} className="block">
            <Card className="transition-colors hover:bg-[#FAFAFA]">
              <div className="flex items-center gap-4">
                <span
                  className="flex size-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_15%,transparent)] text-[var(--gopoli-primary,#1B5E20)]"
                  aria-hidden
                >
                  👥
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">Mi grupo</p>
                  <p className="text-[13px] text-[var(--gopoli-text-muted,#757575)]">
                    Planificación — miembros, iniciar o cancelar
                  </p>
                </div>
                <span aria-hidden className="text-[var(--gopoli-text-muted,#757575)]">
                  ›
                </span>
              </div>
            </Card>
          </Link>
        ) : null}

        {vacio ? (
          <EmptyState
            title="Sin grupo ni viaje activo"
            description="Crea un servicio en Inicio o únete desde Buscar. Cuando haya viaje en curso, verás la ruta en el mapa."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/mapa">
                  <Button>Ir al mapa</Button>
                </Link>
                <Link href="/buscar">
                  <Button variant="outline">Buscar viajes</Button>
                </Link>
              </div>
            }
          />
        ) : null}
      </div>

      <div className="mt-6 flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => void refrescar()}>
          Actualizar
        </Button>
      </div>
    </div>
  );
}
