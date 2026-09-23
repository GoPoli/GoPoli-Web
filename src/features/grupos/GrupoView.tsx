"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ConfirmModal,
  EmptyState,
  Spinner,
} from "@/components/ui";
import {
  ESTADO_SERVICIO_ACTIVO,
  ESTADO_SERVICIO_EN_CURSO,
  ROL_GRUPO_CREADOR,
  cancelarServicio,
  fetchMiembros,
  fetchServicio,
  finalizarServicio,
  iniciarServicio,
  salirServicio,
  ServicioApiError,
  type MiembroGrupo,
} from "@/features/servicios";
import { getUserId } from "@/features/servicios/session";

export type GrupoViewProps = {
  idServicio: number;
};

function etiquetaMiembro(m: MiembroGrupo, esCreadorGrupo: boolean): string {
  const rolPart = m.rolParticipacionLabel;
  if (rolPart) {
    const grupo = esCreadorGrupo ? "Creador del grupo" : "Miembro";
    return `${rolPart} · ${grupo}`;
  }
  return esCreadorGrupo ? "Creador" : "Miembro";
}

const AUTO_REFRESH_MS = 5000;

export function GrupoView({ idServicio }: GrupoViewProps) {
  const router = useRouter();
  const idSesion = getUserId();

  const [miembros, setMiembros] = useState<MiembroGrupo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMiembros, setErrorMiembros] = useState<string | null>(null);
  const [estadoServicio, setEstadoServicio] = useState(ESTADO_SERVICIO_ACTIVO);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<
    null | "cancelar" | "iniciar" | "finalizar" | "salir"
  >(null);
  const [accionPendiente, setAccionPendiente] = useState(false);

  const cargarTodo = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
        setErrorMiembros(null);
      }
      try {
        let list = await fetchMiembros(idServicio);
        if (list.length === 0) {
          await new Promise((r) => setTimeout(r, 450));
          list = await fetchMiembros(idServicio);
        }
        setMiembros(list);
        setErrorMiembros(null);
      } catch (e) {
        const msg =
          e instanceof ServicioApiError
            ? e.body.length > 200
              ? `No se pudo cargar el grupo (${e.status})`
              : e.body || e.message
            : "Error de conexión";
        setMiembros([]);
        setErrorMiembros(msg);
      } finally {
        setCargando(false);
      }

      try {
        const s = await fetchServicio(idServicio);
        if (s) setEstadoServicio(s.idEstadoServicio);
      } catch {
        /* ignore */
      }
    },
    [idServicio],
  );

  useEffect(() => {
    void cargarTodo(true);
    const t = window.setInterval(() => {
      void cargarTodo(false);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(t);
  }, [cargarTodo]);

  const esCreador = miembros.some(
    (m) => m.idUsuario === idSesion && m.rol === ROL_GRUPO_CREADOR,
  );

  async function ejecutarAccion() {
    if (!confirm) return;
    setAccionPendiente(true);
    try {
      if (confirm === "cancelar") {
        await cancelarServicio(idServicio);
        router.push("/viajes");
        return;
      }
      if (confirm === "iniciar") {
        await iniciarServicio(idServicio);
        setEstadoServicio(ESTADO_SERVICIO_EN_CURSO);
        setMensajeToast("¡Viaje iniciado!");
      } else if (confirm === "finalizar") {
        await finalizarServicio(idServicio);
        router.push("/viajes");
        return;
      } else if (confirm === "salir") {
        if (idSesion == null) throw new Error("No hay sesión");
        await salirServicio(idServicio, idSesion);
        router.push("/buscar");
        return;
      }
    } catch (e) {
      const msg =
        e instanceof ServicioApiError
          ? e.body || e.message
          : e instanceof Error
            ? e.message
            : "Error";
      setMensajeToast(msg);
    } finally {
      setAccionPendiente(false);
      setConfirm(null);
    }
  }

  const confirmCopy: Record<
    NonNullable<typeof confirm>,
    { title: string; message: string; label: string; danger?: boolean }
  > = {
    cancelar: {
      title: "Cancelar grupo",
      message:
        "¿Estás seguro que deseas cancelar el grupo? Esta acción no se puede deshacer.",
      label: "Sí, cancelar",
      danger: true,
    },
    iniciar: {
      title: "Iniciar viaje",
      message: "¿Estás seguro que deseas iniciar el viaje?",
      label: "Sí, iniciar",
    },
    finalizar: {
      title: "Finalizar viaje",
      message: "¿Estás seguro que deseas finalizar el viaje?",
      label: "Sí, finalizar",
    },
    salir: {
      title: "Salir del grupo",
      message: "¿Estás seguro que deseas salir del grupo?",
      label: "Sí, salir",
      danger: true,
    },
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--gopoli-mist)] px-4 py-3 md:px-6">
        <div>
          <h1 className="text-lg font-semibold text-[var(--gopoli-pine)]">
            Mi grupo
          </h1>
          <p className="text-xs text-[var(--gopoli-text-muted)]">
            Servicio #{idServicio}
            {estadoServicio === ESTADO_SERVICIO_EN_CURSO
              ? " · En viaje"
              : " · Activo"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/mensajes/${idServicio}`}>
            <Button variant="outline" size="sm">
              Mensajes
            </Button>
          </Link>
          {!cargando ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void cargarTodo(true)}
            >
              Actualizar
            </Button>
          ) : null}
        </div>
      </div>

      {mensajeToast ? (
        <div
          className="mx-4 mt-3 rounded-xl bg-[var(--gopoli-mist)] px-3 py-2 text-sm text-[var(--gopoli-pine)] md:mx-6"
          role="status"
        >
          {mensajeToast}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setMensajeToast(null)}
          >
            Cerrar
          </button>
        </div>
      ) : null}

      {cargando ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner label="Cargando grupo…" />
        </div>
      ) : errorMiembros ? (
        <EmptyState
          title={errorMiembros}
          action={
            <Button onClick={() => void cargarTodo(true)}>Reintentar</Button>
          }
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {miembros.length === 0 ? (
              <EmptyState
                title="Aún no hay personas en este grupo"
                description="Desliza hacia abajo para actualizar o pulsa Actualizar."
              />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {miembros.map((m) => {
                  const esCreadorMiembro = m.rol === ROL_GRUPO_CREADOR;
                  const soyYo = m.idUsuario === idSesion;
                  return (
                    <li
                      key={m.idUsuario}
                      className={[
                        "rounded-2xl border px-4 py-3",
                        soyYo
                          ? "border-[color-mix(in_srgb,var(--gopoli-primary)_30%,transparent)] bg-[var(--gopoli-mist)]"
                          : "border-[var(--gopoli-mist)] bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "flex size-11 items-center justify-center rounded-full text-sm font-semibold",
                            esCreadorMiembro
                              ? "bg-[var(--gopoli-pine)] text-white"
                              : "bg-[var(--gopoli-mist)] text-[var(--gopoli-text-muted)]",
                          ].join(" ")}
                          aria-hidden
                        >
                          {(m.nombreUsuario ?? "?").slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold">
                              {m.nombreUsuario ?? "Usuario"}
                            </p>
                            {soyYo ? (
                              <span className="rounded-md bg-[var(--gopoli-signal)] px-2 py-0.5 text-[11px] font-semibold text-[var(--gopoli-accent)]">
                                Tú
                              </span>
                            ) : null}
                          </div>
                          <p
                            className={[
                              "text-xs",
                              esCreadorMiembro
                                ? "text-[var(--gopoli-secondary)]"
                                : "text-[var(--gopoli-text-muted)]",
                            ].join(" ")}
                          >
                            {etiquetaMiembro(m, esCreadorMiembro)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-[var(--gopoli-mist)] p-4 md:p-6">
            {esCreador ? (
              <div className="flex flex-col gap-3">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() =>
                    setConfirm(
                      estadoServicio === ESTADO_SERVICIO_ACTIVO
                        ? "iniciar"
                        : "finalizar",
                    )
                  }
                >
                  {estadoServicio === ESTADO_SERVICIO_ACTIVO
                    ? "Iniciar viaje"
                    : "Finalizar viaje"}
                </Button>
                {estadoServicio === ESTADO_SERVICIO_ACTIVO ? (
                  <Button
                    fullWidth
                    size="lg"
                    variant="outline"
                    className="border-red-700 text-red-700 hover:bg-red-50"
                    onClick={() => setConfirm("cancelar")}
                  >
                    Cancelar grupo
                  </Button>
                ) : null}
              </div>
            ) : null}
            {!esCreador && estadoServicio === ESTADO_SERVICIO_ACTIVO ? (
              <Button
                fullWidth
                size="lg"
                variant="outline"
                className="border-red-700 text-red-700 hover:bg-red-50"
                onClick={() => setConfirm("salir")}
              >
                Salir del grupo
              </Button>
            ) : null}
          </div>
        </>
      )}

      {confirm ? (
        <ConfirmModal
          open
          title={confirmCopy[confirm].title}
          message={confirmCopy[confirm].message}
          confirmLabel={confirmCopy[confirm].label}
          cancelLabel="No"
          confirmVariant={confirmCopy[confirm].danger ? "danger" : "primary"}
          onClose={() => {
            if (!accionPendiente) setConfirm(null);
          }}
          onConfirm={() => {
            if (!accionPendiente) void ejecutarAccion();
          }}
        />
      ) : null}
    </div>
  );
}
