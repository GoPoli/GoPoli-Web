"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, TextField } from "@/components/ui";
import { getSessionUserId, isSessionDriver } from "@/features/auth/session";
import { fetchLocations, type Location } from "@/features/catalog";
import { createTrip } from "./api";
import {
  DESCRIPTION_MAX_LENGTH,
  MAX_CAPACITY,
  MIN_CAPACITY,
  TRIP_TYPE_DRIVER_GROUP,
  TRIP_TYPE_PASSENGER_GROUP,
} from "./constants";

export type LatLng = { lat: number; lng: number };

export type CreateTripFormProps = {
  onTripCreated: (tripId: number) => void;
  destinationQuery?: string;
  onCoordinatesSelected?: (departure: LatLng | null, arrival: LatLng | null, warning?: string) => void;
  blockedMessage?: string | null;
  stickyAction?: boolean;
  onNoResults?: (noResults: boolean) => void;
};

const MISSING_COORDINATES =
  "no tiene coordenadas en el servidor. Reinicia la API y revisa el log de coordenadas de ubicaciones.";

function toLatLng(location: Location | undefined): LatLng | null {
  if (!location || location.latitude == null || location.longitude == null) return null;
  return { lat: location.latitude, lng: location.longitude };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function CreateTripForm({
  onTripCreated,
  destinationQuery = "",
  onCoordinatesSelected,
  blockedMessage = null,
  stickyAction = false,
  onNoResults,
}: CreateTripFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [departureId, setDepartureId] = useState<number | "">("");
  const [arrivalId, setArrivalId] = useState<number | "">("");
  const [capacity, setCapacity] = useState(MIN_CAPACITY);
  const [tripTypeId, setTripTypeId] = useState(TRIP_TYPE_PASSENGER_GROUP);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [message, setMessage] = useState("");
  const [locationsError, setLocationsError] = useState<string | null>(null);

  const isDriver = isSessionDriver();
  const blocked = Boolean(blockedMessage);

  const minDate = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }, []);

  const notifyCoordinates = useCallback(
    (departure: number | "", arrival: number | "", list: Location[]) => {
      if (!onCoordinatesSelected) return;
      const from = toLatLng(list.find((l) => l.id === departure));
      const to = toLatLng(list.find((l) => l.id === arrival));
      let warning: string | undefined;
      if (departure !== "" && from == null) {
        warning = `La salida elegida ${MISSING_COORDINATES}`;
      } else if (arrival !== "" && to == null) {
        warning = `La llegada elegida ${MISSING_COORDINATES}`;
      }
      onCoordinatesSelected(from, to, warning);
    },
    [onCoordinatesSelected],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchLocations(controller.signal)
      .then((list) => {
        if (!controller.signal.aborted) setLocations(list);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setLocationsError("Error cargando ubicaciones");
        setMessage("Error cargando ubicaciones");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingLocations(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    notifyCoordinates(departureId, arrivalId, locations);
  }, [departureId, arrivalId, locations, notifyCoordinates]);

  const filtered = useMemo(() => {
    const query = destinationQuery.trim().toLowerCase();
    if (!query) return locations;
    return locations.filter((l) => l.name.toLowerCase().includes(query));
  }, [destinationQuery, locations]);

  useEffect(() => {
    if (!onNoResults) return;
    if (!destinationQuery.trim() || loadingLocations) {
      onNoResults(false);
      return;
    }
    onNoResults(filtered.length === 0);
  }, [destinationQuery, filtered.length, loadingLocations, onNoResults]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (blocked) return;

    if (!date || !time || departureId === "" || arrivalId === "") {
      setMessage("Por favor completa todos los campos obligatorios");
      return;
    }
    if (getSessionUserId() == null) {
      setMessage("No hay sesión activa");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const created = await createTrip({
        departureDate: date,
        description,
        departureLocationId: departureId,
        arrivalLocationId: arrivalId,
        departureTime: time.length === 5 ? `${time}:00` : time,
        tripTypeId,
        capacity,
      });
      onTripCreated(created.id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  const suggestions = destinationQuery.trim() && filtered.length > 0 ? filtered.slice(0, 6) : [];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {blockedMessage ? (
        <div
          className="flex gap-2.5 rounded-xl border border-[var(--gopoli-signal)]/35 bg-[var(--gopoli-mist)] p-3 text-[13px] leading-snug text-[var(--gopoli-accent)]"
          role="status"
        >
          <p>{blockedMessage}</p>
        </div>
      ) : null}

      {locationsError ? (
        <p className="text-sm text-red-600" role="alert">
          {locationsError}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="departure-location"
          className="mb-2 block text-sm font-semibold text-[var(--gopoli-pine)]"
        >
          Lugar de salida *
        </label>
        <select
          id="departure-location"
          className="min-h-11 w-full rounded-xl border border-[var(--gopoli-border)] bg-white px-4 py-3 text-base focus:border-[var(--gopoli-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gopoli-signal)]/40"
          value={departureId === "" ? "" : String(departureId)}
          disabled={loadingLocations || blocked}
          onChange={(ev) => {
            const v = ev.target.value;
            setDepartureId(v === "" ? "" : Number.parseInt(v, 10));
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
          htmlFor="arrival-location"
          className="mb-2 block text-sm font-semibold text-[var(--gopoli-pine)]"
        >
          Lugar de llegada *
        </label>
        {suggestions.length > 0 ? (
          <div className="mb-3">
            <p className="mb-2 text-xs text-[var(--gopoli-text-muted)]">Sugerencias</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="min-h-11 rounded-full bg-[var(--gopoli-mist)] px-3 py-2 text-sm text-[var(--gopoli-pine)] transition-colors hover:bg-[color-mix(in_srgb,var(--gopoli-mist)_70%,var(--gopoli-secondary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)]"
                  onClick={() => setArrivalId(l.id)}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <select
          id="arrival-location"
          className="min-h-11 w-full rounded-xl border border-[var(--gopoli-border)] bg-white px-4 py-3 text-base focus:border-[var(--gopoli-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gopoli-signal)]/40"
          value={arrivalId === "" ? "" : String(arrivalId)}
          disabled={loadingLocations || blocked}
          onChange={(ev) => {
            const v = ev.target.value;
            setArrivalId(v === "" ? "" : Number.parseInt(v, 10));
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

      <div>
        <label htmlFor="trip-date" className="mb-2 block text-sm font-semibold text-[var(--gopoli-pine)]">
          Fecha *
        </label>
        <input
          id="trip-date"
          type="date"
          min={minDate}
          value={date}
          disabled={blocked}
          onChange={(ev) => setDate(ev.target.value)}
          className="min-h-11 w-full rounded-xl border border-[var(--gopoli-border)] bg-white px-4 py-3 text-base focus:border-[var(--gopoli-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gopoli-signal)]/40"
        />
      </div>

      <div>
        <label htmlFor="trip-time" className="mb-2 block text-sm font-semibold text-[var(--gopoli-pine)]">
          Hora de salida *
        </label>
        <input
          id="trip-time"
          type="time"
          value={time}
          disabled={blocked}
          onChange={(ev) => setTime(ev.target.value)}
          className="min-h-11 w-full rounded-xl border border-[var(--gopoli-border)] bg-white px-4 py-3 text-base focus:border-[var(--gopoli-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gopoli-signal)]/40"
        />
      </div>

      <fieldset disabled={blocked}>
        <legend className="mb-2 text-sm font-semibold text-[var(--gopoli-pine)]">Tipo de viaje *</legend>
        <label className="mb-2 flex cursor-pointer gap-3">
          <input
            type="radio"
            name="trip-type"
            checked={tripTypeId === TRIP_TYPE_PASSENGER_GROUP}
            onChange={() => setTripTypeId(TRIP_TYPE_PASSENGER_GROUP)}
            className="mt-1 accent-[var(--gopoli-primary,#1B5E20)]"
          />
          <span>
            <span className="block font-medium">Grupo de viaje</span>
            <span className="block text-xs text-[var(--gopoli-text-muted,#757575)]">
              Pasajeros que contratan servicio externo (taxi, InDrive, etc.)
            </span>
          </span>
        </label>
        {isDriver ? (
          <label className="flex cursor-pointer gap-3">
            <input
              type="radio"
              name="trip-type"
              checked={tripTypeId === TRIP_TYPE_DRIVER_GROUP}
              onChange={() => setTripTypeId(TRIP_TYPE_DRIVER_GROUP)}
              className="mt-1 accent-[var(--gopoli-primary,#1B5E20)]"
            />
            <span>
              <span className="block font-medium">Grupo conductor</span>
              <span className="block text-xs text-[var(--gopoli-text-muted,#757575)]">
                Viaje ofrecido por conductor con vehículo propio
              </span>
            </span>
          </label>
        ) : null}
      </fieldset>

      <TextField
        multiline
        label="Descripción"
        placeholder="Describe tu servicio..."
        value={description}
        maxLength={DESCRIPTION_MAX_LENGTH}
        disabled={blocked}
        onChange={(ev) => setDescription(ev.target.value)}
        rows={3}
      />

      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--gopoli-pine)]">Capacidad *</p>
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="Reducir capacidad"
            disabled={capacity <= MIN_CAPACITY || blocked}
            onClick={() => setCapacity((c) => Math.max(MIN_CAPACITY, c - 1))}
            className="inline-flex size-11 items-center justify-center rounded-full text-2xl text-[var(--gopoli-primary)] transition-colors hover:bg-[var(--gopoli-mist)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)]"
          >
            −
          </button>
          <span className="text-[28px] font-bold tabular-nums text-[var(--gopoli-accent)]">{capacity}</span>
          <button
            type="button"
            aria-label="Aumentar capacidad"
            disabled={capacity >= MAX_CAPACITY || blocked}
            onClick={() => setCapacity((c) => Math.min(MAX_CAPACITY, c + 1))}
            className="inline-flex size-11 items-center justify-center rounded-full text-2xl text-[var(--gopoli-primary)] transition-colors hover:bg-[var(--gopoli-mist)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)]"
          >
            +
          </button>
        </div>
      </div>

      <div
        className={
          stickyAction
            ? "sticky bottom-0 z-10 -mx-4 mt-1 border-t border-[var(--gopoli-mist)] bg-[var(--gopoli-paper)] px-4 py-3"
            : "contents"
        }
      >
        <Button type="submit" fullWidth size="lg" loading={submitting} disabled={blocked || loadingLocations}>
          Confirmar viaje
        </Button>

        {message ? (
          <p
            className={`mt-2 text-center text-sm ${
              message.includes("exitosamente") ? "text-[var(--gopoli-secondary,#2E7D32)]" : "text-red-600"
            }`}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
