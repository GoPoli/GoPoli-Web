import { apiRequest, apiRequestOrNull } from "@/lib/api/client";
import { asRecords, isRecord, toInt, toOptionalText, toText, type JsonRecord } from "@/lib/parse";
import type { CreateTripPayload, Trip, TripMember } from "./types";

function parseTrip(raw: unknown): Trip | null {
  if (!isRecord(raw)) return null;
  const id = toInt(raw.id);
  const departureLocationId = toInt(raw.departureLocationId);
  const arrivalLocationId = toInt(raw.arrivalLocationId);
  const creatorId = toInt(raw.creatorId);
  const tripTypeId = toInt(raw.tripTypeId);
  const statusId = toInt(raw.statusId);
  const capacity = toInt(raw.capacity);
  if (
    id == null ||
    departureLocationId == null ||
    arrivalLocationId == null ||
    creatorId == null ||
    tripTypeId == null ||
    statusId == null ||
    capacity == null
  ) {
    return null;
  }
  return {
    id,
    departureDate: toText(raw.departureDate),
    description: toOptionalText(raw.description),
    departureLocationId,
    arrivalLocationId,
    departureTime: toText(raw.departureTime),
    creatorId,
    tripTypeId,
    statusId,
    capacity,
    tripType: toText(raw.tripType, "passenger_group"),
    tripTypeLabel: toText(raw.tripTypeLabel, "Grupo de viaje"),
  };
}

function parseMember(raw: JsonRecord): TripMember | null {
  const userId = toInt(raw.userId);
  if (userId == null) return null;
  return {
    userId,
    groupRole: toText(raw.groupRole),
    participationRole: toOptionalText(raw.participationRole),
    participationRoleLabel: toOptionalText(raw.participationRoleLabel),
    userName: toOptionalText(raw.userName),
  };
}

function requireTrip(raw: unknown): Trip {
  const trip = parseTrip(raw);
  if (!trip) throw new Error("Respuesta de viaje inválida");
  return trip;
}

export async function createTrip(payload: CreateTripPayload, signal?: AbortSignal): Promise<Trip> {
  const json = await apiRequest("/trips", {
    method: "POST",
    body: payload,
    signal,
    fallbackError: "Error al crear el servicio",
  });
  return requireTrip(json);
}

export async function fetchActiveTrips(signal?: AbortSignal): Promise<Trip[]> {
  const json = await apiRequest("/trips/active", { signal, fallbackError: "Error al listar servicios" });
  return asRecords(json)
    .map(parseTrip)
    .filter((trip): trip is Trip => trip != null);
}

export async function joinTrip(tripId: number, signal?: AbortSignal): Promise<string> {
  const message = await apiRequest<string>(`/trips/${tripId}/join`, {
    method: "POST",
    signal,
    fallbackError: "Error al unirse",
  });
  return message || "Te uniste al grupo exitosamente";
}

export async function fetchTrip(tripId: number, signal?: AbortSignal): Promise<Trip | null> {
  const json = await apiRequestOrNull(`/trips/${tripId}`, { signal, fallbackError: "Error al cargar servicio" });
  return json == null ? null : parseTrip(json);
}

export async function fetchTripMembers(tripId: number, signal?: AbortSignal): Promise<TripMember[]> {
  const json = await apiRequest(`/trips/${tripId}/members`, { signal, fallbackError: "Error al traer miembros" });
  return asRecords(json)
    .map(parseMember)
    .filter((member): member is TripMember => member != null);
}

async function changeTripStatus(tripId: number, action: string, fallback: string): Promise<string> {
  const message = await apiRequest<string>(`/trips/${tripId}/${action}`, {
    method: "PUT",
    fallbackError: fallback,
  });
  return message || fallback;
}

export function cancelTrip(tripId: number): Promise<string> {
  return changeTripStatus(tripId, "cancel", "Servicio cancelado");
}

export function startTrip(tripId: number): Promise<string> {
  return changeTripStatus(tripId, "start", "Viaje iniciado");
}

export function finishTrip(tripId: number): Promise<string> {
  return changeTripStatus(tripId, "finish", "Viaje finalizado");
}

export async function leaveTrip(tripId: number, userId: number): Promise<string> {
  const message = await apiRequest<string>(`/trips/${tripId}/members/${userId}`, {
    method: "DELETE",
    fallbackError: "Error al salir",
  });
  return message || "Saliste del grupo";
}

async function fetchUserTrip(userId: number, kind: string, signal?: AbortSignal): Promise<Trip | null> {
  const json = await apiRequestOrNull(`/users/${userId}/trips/${kind}`, { signal });
  return json == null ? null : parseTrip(json);
}

export function fetchCreatedActiveTrip(userId: number, signal?: AbortSignal): Promise<Trip | null> {
  return fetchUserTrip(userId, "active", signal);
}

export function fetchJoinedActiveTrip(userId: number, signal?: AbortSignal): Promise<Trip | null> {
  return fetchUserTrip(userId, "member", signal);
}

export function fetchTripInProgress(userId: number, signal?: AbortSignal): Promise<Trip | null> {
  return fetchUserTrip(userId, "in-progress", signal);
}

export async function fetchActiveTripId(userId: number, signal?: AbortSignal): Promise<number | null> {
  const asCreator = await fetchCreatedActiveTrip(userId, signal);
  if (asCreator) return asCreator.id;
  const asMember = await fetchJoinedActiveTrip(userId, signal);
  return asMember?.id ?? null;
}
