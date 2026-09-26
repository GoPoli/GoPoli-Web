"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmModal, EmptyState, Spinner } from "@/components/ui";
import { getSessionUserId } from "@/features/auth/session";
import {
  GROUP_ROLE_CREATOR,
  TRIP_STATUS_ACTIVE,
  TRIP_STATUS_IN_PROGRESS,
  cancelTrip,
  fetchTrip,
  fetchTripMembers,
  finishTrip,
  leaveTrip,
  startTrip,
  type TripMember,
} from "@/features/trips";
import { ApiError } from "@/lib/api/client";

export type GroupViewProps = {
  tripId: number;
};

type GroupAction = "cancel" | "start" | "finish" | "leave";

const AUTO_REFRESH_MS = 5000;

const CONFIRM_COPY: Record<GroupAction, { title: string; message: string; label: string; danger?: boolean }> = {
  cancel: {
    title: "Cancelar grupo",
    message: "¿Estás seguro que deseas cancelar el grupo? Esta acción no se puede deshacer.",
    label: "Sí, cancelar",
    danger: true,
  },
  start: {
    title: "Iniciar viaje",
    message: "¿Estás seguro que deseas iniciar el viaje?",
    label: "Sí, iniciar",
  },
  finish: {
    title: "Finalizar viaje",
    message: "¿Estás seguro que deseas finalizar el viaje?",
    label: "Sí, finalizar",
  },
  leave: {
    title: "Salir del grupo",
    message: "¿Estás seguro que deseas salir del grupo?",
    label: "Sí, salir",
    danger: true,
  },
};

function memberLabel(member: TripMember, isCreator: boolean): string {
  if (member.participationRoleLabel) {
    return `${member.participationRoleLabel} · ${isCreator ? "Creador del grupo" : "Miembro"}`;
  }
  return isCreator ? "Creador" : "Miembro";
}

// Si la lista llega vacía justo después de crear el grupo, se reintenta una vez.
async function loadMembers(tripId: number): Promise<TripMember[]> {
  const list = await fetchTripMembers(tripId);
  if (list.length > 0) return list;
  await new Promise((resolve) => setTimeout(resolve, 450));
  return fetchTripMembers(tripId);
}

function membersErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Error de conexión";
  return error.message.length > 200 ? `No se pudo cargar el grupo (${error.status})` : error.message;
}

export function GroupView({ tripId }: GroupViewProps) {
  const router = useRouter();
  const sessionUserId = getSessionUserId();

  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [tripStatus, setTripStatus] = useState(TRIP_STATUS_ACTIVE);
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<GroupAction | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const query = useCallback(
    () =>
      loadMembers(tripId)
        .then((list) => {
          setMembers(list);
          setMembersError(null);
        })
        .catch((error: unknown) => {
          setMembers([]);
          setMembersError(membersErrorMessage(error));
        })
        .finally(() => setLoading(false))
        .then(() => fetchTrip(tripId))
        .then((trip) => {
          if (trip) setTripStatus(trip.statusId);
        })
        .catch(() => undefined),
    [tripId],
  );

  const reload = useCallback(() => {
    setLoading(true);
    setMembersError(null);
    return query();
  }, [query]);

  useEffect(() => {
    void query();
    const timer = window.setInterval(() => void query(), AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [query]);

  const isCreator = members.some((m) => m.userId === sessionUserId && m.groupRole === GROUP_ROLE_CREATOR);

  async function runAction() {
    if (!confirm) return;
    setActionPending(true);
    try {
      if (confirm === "cancel") {
        await cancelTrip(tripId);
        router.push("/trips");
      } else if (confirm === "start") {
        await startTrip(tripId);
        setTripStatus(TRIP_STATUS_IN_PROGRESS);
        setToast("¡Viaje iniciado!");
      } else if (confirm === "finish") {
        await finishTrip(tripId);
        router.push("/trips");
      } else {
        if (sessionUserId == null) throw new Error("No hay sesión");
        await leaveTrip(tripId, sessionUserId);
        router.push("/search");
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Error");
    } finally {
      setActionPending(false);
      setConfirm(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--gopoli-mist)] px-4 py-3 md:px-6">
        <div>
          <h1 className="text-lg font-semibold text-[var(--gopoli-pine)]">Mi grupo</h1>
          <p className="text-xs text-[var(--gopoli-text-muted)]">
            Servicio #{tripId}
            {tripStatus === TRIP_STATUS_IN_PROGRESS ? " · En viaje" : " · Activo"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/messages/${tripId}`}>
            <Button variant="outline" size="sm">
              Mensajes
            </Button>
          </Link>
          {!loading ? (
            <Button variant="ghost" size="sm" onClick={() => void reload()}>
              Actualizar
            </Button>
          ) : null}
        </div>
      </div>

      {toast ? (
        <div
          className="mx-4 mt-3 rounded-xl bg-[var(--gopoli-mist)] px-3 py-2 text-sm text-[var(--gopoli-pine)] md:mx-6"
          role="status"
        >
          {toast}
          <button type="button" className="ml-2 underline" onClick={() => setToast(null)}>
            Cerrar
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner label="Cargando grupo…" />
        </div>
      ) : membersError ? (
        <EmptyState title={membersError} action={<Button onClick={() => void reload()}>Reintentar</Button>} />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {members.length === 0 ? (
              <EmptyState
                title="Aún no hay personas en este grupo"
                description="Desliza hacia abajo para actualizar o pulsa Actualizar."
              />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {members.map((m) => {
                  const memberIsCreator = m.groupRole === GROUP_ROLE_CREATOR;
                  const isMe = m.userId === sessionUserId;
                  return (
                    <li
                      key={m.userId}
                      className={[
                        "rounded-2xl border px-4 py-3",
                        isMe
                          ? "border-[color-mix(in_srgb,var(--gopoli-primary)_30%,transparent)] bg-[var(--gopoli-mist)]"
                          : "border-[var(--gopoli-mist)] bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "flex size-11 items-center justify-center rounded-full text-sm font-semibold",
                            memberIsCreator
                              ? "bg-[var(--gopoli-pine)] text-white"
                              : "bg-[var(--gopoli-mist)] text-[var(--gopoli-text-muted)]",
                          ].join(" ")}
                          aria-hidden
                        >
                          {(m.userName ?? "?").slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold">{m.userName ?? "Usuario"}</p>
                            {isMe ? (
                              <span className="rounded-md bg-[var(--gopoli-signal)] px-2 py-0.5 text-[11px] font-semibold text-[var(--gopoli-accent)]">
                                Tú
                              </span>
                            ) : null}
                          </div>
                          <p
                            className={[
                              "text-xs",
                              memberIsCreator ? "text-[var(--gopoli-secondary)]" : "text-[var(--gopoli-text-muted)]",
                            ].join(" ")}
                          >
                            {memberLabel(m, memberIsCreator)}
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
            {isCreator ? (
              <div className="flex flex-col gap-3">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => setConfirm(tripStatus === TRIP_STATUS_ACTIVE ? "start" : "finish")}
                >
                  {tripStatus === TRIP_STATUS_ACTIVE ? "Iniciar viaje" : "Finalizar viaje"}
                </Button>
                {tripStatus === TRIP_STATUS_ACTIVE ? (
                  <Button
                    fullWidth
                    size="lg"
                    variant="outline"
                    className="border-red-700 text-red-700 hover:bg-red-50"
                    onClick={() => setConfirm("cancel")}
                  >
                    Cancelar grupo
                  </Button>
                ) : null}
              </div>
            ) : null}
            {!isCreator && tripStatus === TRIP_STATUS_ACTIVE ? (
              <Button
                fullWidth
                size="lg"
                variant="outline"
                className="border-red-700 text-red-700 hover:bg-red-50"
                onClick={() => setConfirm("leave")}
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
          title={CONFIRM_COPY[confirm].title}
          message={CONFIRM_COPY[confirm].message}
          confirmLabel={CONFIRM_COPY[confirm].label}
          cancelLabel="No"
          confirmVariant={CONFIRM_COPY[confirm].danger ? "danger" : "primary"}
          onClose={() => {
            if (!actionPending) setConfirm(null);
          }}
          onConfirm={() => {
            if (!actionPending) void runAction();
          }}
        />
      ) : null}
    </div>
  );
}
