"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  EmptyState,
  Spinner,
  TripTypeBadge,
} from "@/components/ui";
import {
  fetchServiciosActivos,
  ServicioApiError,
  unirseServicio,
  useEstadoViajesUsuario,
  type ServicioEnriquecido,
} from "@/features/servicios";
import { getUserId } from "@/features/servicios/session";

export function BuscarViajesView() {
  const router = useRouter();
  const {
    idServicioActivo,
    idServicioEnCurso,
    refrescar: refrescarEstado,
  } = useEstadoViajesUsuario();

  const [servicios, setServicios] = useState<ServicioEnriquecido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uniendoId, setUniendoId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const list = await fetchServiciosActivos();
      setServicios(list);
      await refrescarEstado();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al cargar servicios activos",
      );
    } finally {
      setCargando(false);
    }
  }, [refrescarEstado]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function onUnirse(idServicio: number) {
    const idUsuario = getUserId();
    if (idUsuario == null) {
      setToast("No hay sesión activa");
      return;
    }
    setUniendoId(idServicio);
    try {
      await unirseServicio({ idServicio, idUsuario });
      router.push(`/grupo/${idServicio}`);
    } catch (e) {
      const msg =
        e instanceof ServicioApiError
          ? e.body || e.message
          : "Error de conexión";
      setToast(msg);
    } finally {
      setUniendoId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
      {idServicioEnCurso != null ? (
        <Link
          href={`/mapa?viaje=${idServicioEnCurso}`}
          className="flex items-center gap-2.5 bg-[var(--gopoli-secondary,#2E7D32)] px-4 py-3 text-sm font-semibold text-white"
        >
          <span aria-hidden>🗺</span>
          <span className="flex-1">
            Viaje en curso — Ver ruta en el mapa (Inicio)
          </span>
          <span aria-hidden>↗</span>
        </Link>
      ) : null}

      {toast ? (
        <div
          className="mx-4 mt-3 rounded-[10px] bg-[#FFF3E0] px-3 py-2 text-sm text-[#BF360C] md:mx-6"
          role="status"
        >
          {toast}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setToast(null)}
          >
            Cerrar
          </button>
        </div>
      ) : null}

      <div className="flex-1 p-4 md:p-6">
        {cargando ? (
          <div className="flex justify-center py-16">
            <Spinner label="Cargando servicios…" />
          </div>
        ) : error ? (
          <EmptyState
            title={error}
            action={<Button onClick={() => void cargar()}>Reintentar</Button>}
          />
        ) : servicios.length === 0 ? (
          <EmptyState
            title="No hay servicios activos"
            description="¡Crea el primero! Desliza o pulsa actualizar."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => void cargar()}>Actualizar</Button>
                <Button variant="secondary" onClick={() => router.push("/mapa")}>
                  Crear servicio
                </Button>
              </div>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {servicios.map((s) => (
              <li key={s.idServicio}>
                <Card>
                  <TripTypeBadge
                    tripTypeLabel={s.tripTypeLabel}
                    idTipoServicio={s.idTipoServicio}
                  />
                  <p className="mt-2 text-xs text-[var(--gopoli-text-muted,#757575)]">
                    {s.fecha} — {s.horaSalida}
                  </p>
                  {s.descripcion ? (
                    <p className="mt-2 text-sm text-[var(--foreground,#171717)]">
                      {s.descripcion}
                    </p>
                  ) : null}
                  <Button
                    fullWidth
                    className="mt-3"
                    loading={uniendoId === s.idServicio}
                    onClick={() => void onUnirse(s.idServicio)}
                  >
                    Unirse
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sticky bottom-20 z-10 flex flex-col items-end gap-3 p-4 md:bottom-6">
        {idServicioEnCurso != null ? (
          <Link href={`/mapa?viaje=${idServicioEnCurso}`}>
            <Button variant="secondary" leftIcon={<span aria-hidden>🗺</span>}>
              Ver ruta del viaje
            </Button>
          </Link>
        ) : idServicioActivo != null ? (
          <>
            <Link href={`/grupo/${idServicioActivo}`}>
              <Button variant="secondary" leftIcon={<span aria-hidden>👥</span>}>
                Ver mi grupo
              </Button>
            </Link>
            <Link href="/mapa">
              <Button size="sm" aria-label="Ir al mapa">
                🗺
              </Button>
            </Link>
          </>
        ) : (
          <Link href="/mapa">
            <Button leftIcon={<span aria-hidden>+</span>}>Crear servicio</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
