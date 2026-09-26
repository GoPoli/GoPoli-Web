"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, EmptyState, Spinner, TextField } from "@/components/ui";
import { getSessionUserId, isSessionDriver } from "@/features/auth/session";
import { fetchLocations, type Location } from "@/features/catalog";
import {
  createTrip,
  useUserTrips,
  DESCRIPTION_MAX_LENGTH,
  MAX_CAPACITY,
  MIN_CAPACITY,
  TRIP_TYPE_DRIVER_GROUP,
  TRIP_TYPE_PASSENGER_GROUP,
} from "@/features/trips";
import { ApiError } from "@/lib/api/client";
import { createRecurringRoute, deleteRecurringRoute, fetchRecurringRoutes, updateRecurringRoute } from "./api";
import type { RecurringRoute, SaveRecurringRoutePayload } from "./types";

const WEEKDAYS: { value: number; short: string; long: string }[] = [
  { value: 1, short: "Lun", long: "Lunes" },
  { value: 2, short: "Mar", long: "Martes" },
  { value: 3, short: "Mié", long: "Miércoles" },
  { value: 4, short: "Jue", long: "Jueves" },
  { value: 5, short: "Vie", long: "Viernes" },
  { value: 6, short: "Sáb", long: "Sábado" },
  { value: 7, short: "Dom", long: "Domingo" },
];

const ACTIVE_TRIP_MESSAGE =
  "Ya tienes un servicio activo. En la pestaña Viajes abre “Mi grupo” y, si eres creador, cancela o finaliza el viaje para poder crear otro.";

const SELECT_CLASS =
  "w-full rounded-[10px] border border-[var(--gopoli-border,#E0E0E0)] bg-white px-4 py-3.5 text-[15px] focus:border-2 focus:border-[var(--gopoli-primary,#1B5E20)] focus:outline-none";

function parseWeekdays(raw: string): number[] {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => n >= 1 && n <= 7);
}

function formatWeekdays(days: number[]): string {
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

function weekdaysLabel(weekdays: string): string {
  const set = new Set(parseWeekdays(weekdays));
  if (set.size === 0) return "Sin días";
  return WEEKDAYS.filter((d) => set.has(d.value))
    .map((d) => d.short)
    .join(" · ");
}

function timeForInput(time: string): string {
  if (!time) return "";
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function withSeconds(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

function todayIsoLocal(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Día ISO de hoy: lunes = 1 … domingo = 7 (getDay() devuelve domingo = 0).
function todayIsoWeekday(): number {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

type FormState = {
  departureLocationId: number | "";
  arrivalLocationId: number | "";
  weekdays: number[];
  time: string;
  capacity: number;
  tripTypeId: number;
  description: string;
};

const emptyForm = (): FormState => ({
  departureLocationId: "",
  arrivalLocationId: "",
  weekdays: [1, 2, 3, 4, 5],
  time: "",
  capacity: MIN_CAPACITY,
  tripTypeId: TRIP_TYPE_PASSENGER_GROUP,
  description: "",
});

function formFromRoute(route: RecurringRoute): FormState {
  return {
    departureLocationId: route.departureLocationId,
    arrivalLocationId: route.arrivalLocationId,
    weekdays: parseWeekdays(route.weekdays),
    time: timeForInput(route.departureTime),
    capacity: route.capacity,
    tripTypeId: route.tripTypeId || TRIP_TYPE_PASSENGER_GROUP,
    description: route.description ?? "",
  };
}

export function ScheduleView() {
  const router = useRouter();
  const userId = getSessionUserId();
  const isDriver = isSessionDriver();
  const { activeTripId, refresh: refreshUserTrips } = useUserTrips();

  const blockedMessage = useMemo(() => (activeTripId != null ? ACTIVE_TRIP_MESSAGE : null), [activeTripId]);

  const [routes, setRoutes] = useState<RecurringRoute[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const noSession = userId == null;
  const visibleError = noSession ? "Inicia sesión para ver tu agenda" : error;
  const visibleLoading = loading && !noSession;

  const query = useCallback(
    (signal?: AbortSignal) => {
      if (userId == null) return Promise.resolve();
      return Promise.all([fetchRecurringRoutes(userId, signal), fetchLocations(signal)])
        .then(([routeList, locationList]) => {
          if (signal?.aborted) return;
          setRoutes(routeList);
          setLocations(locationList);
        })
        .catch((err: unknown) => {
          if (signal?.aborted) return;
          setError(err instanceof ApiError ? err.message : "No se pudo cargar la agenda");
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [userId],
  );

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return query();
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    void query(controller.signal);
    return () => controller.abort();
  }, [query]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
    setMessage(null);
  }

  function openEdit(route: RecurringRoute) {
    setEditingId(route.id);
    setForm(formFromRoute(route));
    setFormOpen(true);
    setMessage(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  function toggleWeekday(value: number) {
    setForm((f) => ({
      ...f,
      weekdays: f.weekdays.includes(value) ? f.weekdays.filter((d) => d !== value) : [...f.weekdays, value],
    }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (userId == null) {
      setMessage("No hay sesión activa");
      return;
    }
    if (form.departureLocationId === "" || form.arrivalLocationId === "" || !form.time || form.weekdays.length === 0) {
      setMessage("Completa salida, llegada, hora y al menos un día");
      return;
    }
    if (form.departureLocationId === form.arrivalLocationId) {
      setMessage("Salida y llegada deben ser distintas");
      return;
    }

    const payload: SaveRecurringRoutePayload = {
      departureLocationId: form.departureLocationId,
      arrivalLocationId: form.arrivalLocationId,
      weekdays: formatWeekdays(form.weekdays),
      departureTime: withSeconds(form.time),
      capacity: form.capacity,
      tripTypeId: form.tripTypeId,
      description: form.description,
    };

    setSaving(true);
    setMessage(null);
    try {
      if (editingId != null) {
        await updateRecurringRoute(editingId, payload);
      } else {
        await createRecurringRoute(payload);
      }
      closeForm();
      await reload();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(route: RecurringRoute) {
    if (userId == null) return;
    if (!window.confirm("¿Eliminar esta ruta habitual?")) return;
    setMessage(null);
    try {
      await deleteRecurringRoute(route.id);
      await reload();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "No se pudo eliminar");
    }
  }

  async function onPublishToday(route: RecurringRoute) {
    if (blockedMessage) return;
    if (getSessionUserId() == null) {
      setMessage("No hay sesión activa");
      return;
    }
    setPublishingId(route.id);
    setMessage(null);
    try {
      const created = await createTrip({
        departureDate: todayIsoLocal(),
        description: route.description ?? "",
        departureLocationId: route.departureLocationId,
        arrivalLocationId: route.arrivalLocationId,
        departureTime: withSeconds(route.departureTime),
        tripTypeId: route.tripTypeId || TRIP_TYPE_PASSENGER_GROUP,
        capacity: route.capacity,
      });
      void refreshUserTrips();
      router.push(`/groups/${created.id}`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Error al publicar el servicio");
    } finally {
      setPublishingId(null);
    }
  }

  if (visibleLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Cargando agenda…" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <div className="mb-5 rounded-2xl border border-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_20%,transparent)] bg-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_12%,transparent)] p-[18px]">
        <h1 className="text-xl font-bold text-[var(--gopoli-primary,#1B5E20)]">Agenda</h1>
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--gopoli-text-muted,#757575)]">
          Guarda tu trayecto habitual y publícalo hoy sin volver a llenar el formulario del mapa.
        </p>
      </div>

      {blockedMessage ? (
        <div
          className="mb-4 flex gap-2.5 rounded-[10px] border border-[#FFB74D] bg-[#FFF3E0] p-3 text-[13px] leading-snug text-[#BF360C]"
          role="status"
        >
          <span aria-hidden>ℹ</span>
          <p>{blockedMessage}</p>
        </div>
      ) : null}

      {visibleError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {visibleError}{" "}
          <button type="button" className="underline" onClick={() => void reload()}>
            Reintentar
          </button>
        </p>
      ) : null}

      {message ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {message}
        </p>
      ) : null}

      {!formOpen ? (
        <div className="mb-4">
          <Button type="button" fullWidth onClick={openNew}>
            Nueva ruta habitual
          </Button>
        </div>
      ) : null}

      {formOpen ? (
        <Card className="mb-5">
          <h2 className="mb-4 text-base font-bold text-[var(--gopoli-primary,#1B5E20)]">
            {editingId != null ? "Editar ruta" : "Nueva ruta habitual"}
          </h2>
          <form onSubmit={onSave} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="schedule-departure"
                className="mb-2 block text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]"
              >
                Lugar de salida *
              </label>
              <select
                id="schedule-departure"
                className={SELECT_CLASS}
                value={form.departureLocationId === "" ? "" : String(form.departureLocationId)}
                onChange={(ev) => {
                  const v = ev.target.value;
                  setForm((f) => ({ ...f, departureLocationId: v === "" ? "" : Number.parseInt(v, 10) }));
                }}
              >
                <option value="">Desde dónde sales</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="schedule-arrival"
                className="mb-2 block text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]"
              >
                Lugar de llegada *
              </label>
              <select
                id="schedule-arrival"
                className={SELECT_CLASS}
                value={form.arrivalLocationId === "" ? "" : String(form.arrivalLocationId)}
                onChange={(ev) => {
                  const v = ev.target.value;
                  setForm((f) => ({ ...f, arrivalLocationId: v === "" ? "" : Number.parseInt(v, 10) }));
                }}
              >
                <option value="">¿A dónde vamos?</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]">
                Días de la semana *
              </legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const selected = form.weekdays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      aria-pressed={selected}
                      aria-label={d.long}
                      onClick={() => toggleWeekday(d.value)}
                      className={[
                        "rounded-[10px] px-3 py-2 text-sm font-medium",
                        selected
                          ? "bg-[var(--gopoli-primary,#1B5E20)] text-white"
                          : "bg-[#E8F5E9] text-[var(--gopoli-primary,#1B5E20)]",
                      ].join(" ")}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="schedule-time"
                className="mb-2 block text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]"
              >
                Hora de salida *
              </label>
              <input
                id="schedule-time"
                type="time"
                value={form.time}
                onChange={(ev) => setForm((f) => ({ ...f, time: ev.target.value }))}
                className={SELECT_CLASS}
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]">Tipo de viaje *</legend>
              <label className="mb-2 flex cursor-pointer gap-3">
                <input
                  type="radio"
                  name="schedule-trip-type"
                  checked={form.tripTypeId === TRIP_TYPE_PASSENGER_GROUP}
                  onChange={() => setForm((f) => ({ ...f, tripTypeId: TRIP_TYPE_PASSENGER_GROUP }))}
                  className="mt-1 accent-[var(--gopoli-primary,#1B5E20)]"
                />
                <span className="font-medium">Grupo de viaje</span>
              </label>
              {isDriver ? (
                <label className="flex cursor-pointer gap-3">
                  <input
                    type="radio"
                    name="schedule-trip-type"
                    checked={form.tripTypeId === TRIP_TYPE_DRIVER_GROUP}
                    onChange={() => setForm((f) => ({ ...f, tripTypeId: TRIP_TYPE_DRIVER_GROUP }))}
                    className="mt-1 accent-[var(--gopoli-primary,#1B5E20)]"
                  />
                  <span className="font-medium">Grupo conductor</span>
                </label>
              ) : null}
            </fieldset>

            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--gopoli-primary,#1B5E20)]">Capacidad *</p>
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  aria-label="Reducir capacidad"
                  disabled={form.capacity <= MIN_CAPACITY}
                  onClick={() => setForm((f) => ({ ...f, capacity: Math.max(MIN_CAPACITY, f.capacity - 1) }))}
                  className="text-3xl text-[var(--gopoli-primary,#1B5E20)] disabled:opacity-40"
                >
                  −
                </button>
                <span className="text-[28px] font-bold tabular-nums">{form.capacity}</span>
                <button
                  type="button"
                  aria-label="Aumentar capacidad"
                  disabled={form.capacity >= MAX_CAPACITY}
                  onClick={() => setForm((f) => ({ ...f, capacity: Math.min(MAX_CAPACITY, f.capacity + 1) }))}
                  className="text-3xl text-[var(--gopoli-primary,#1B5E20)] disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <TextField
              multiline
              label="Descripción"
              placeholder="Opcional…"
              value={form.description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
              rows={2}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" fullWidth loading={saving}>
                {editingId != null ? "Guardar cambios" : "Guardar ruta"}
              </Button>
              <Button type="button" variant="outline" fullWidth disabled={saving} onClick={closeForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {routes.length === 0 && !formOpen ? (
        <EmptyState
          title="Sin rutas guardadas"
          description="Crea una ruta habitual con salida, llegada, días, hora y cupos. Luego publícala el día que la necesites."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {routes.map((route) => {
            const runsToday = parseWeekdays(route.weekdays).includes(todayIsoWeekday());
            return (
              <li key={route.id}>
                <Card>
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--gopoli-text,#212121)]">
                        {route.departureLocationName ?? `Salida #${route.departureLocationId}`}
                        <span className="mx-1.5 text-[var(--gopoli-text-muted,#757575)]">→</span>
                        {route.arrivalLocationName ?? `Llegada #${route.arrivalLocationId}`}
                      </p>
                      <p className="mt-1 text-[13px] text-[var(--gopoli-text-muted,#757575)]">
                        {weekdaysLabel(route.weekdays)} · {timeForInput(route.departureTime) || "—"} · {route.capacity} cupos
                        {!runsToday ? <span className="ml-1 text-[#BF360C]">(hoy no está en tu calendario)</span> : null}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={Boolean(blockedMessage) || publishingId != null}
                        loading={publishingId === route.id}
                        onClick={() => void onPublishToday(route)}
                      >
                        Publicar hoy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={publishingId != null}
                        onClick={() => openEdit(route)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={publishingId != null}
                        onClick={() => void onDelete(route)}
                      >
                        Eliminar
                      </Button>
                    </div>
                    {activeTripId != null ? (
                      <Link
                        href={`/groups/${activeTripId}`}
                        className="text-sm font-medium text-[var(--gopoli-primary,#1B5E20)] underline"
                      >
                        Ver mi grupo activo
                      </Link>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
