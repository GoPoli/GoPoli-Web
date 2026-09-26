import { apiRequest } from "@/lib/api/client";
import { asRecords, isRecord, toInt, toOptionalText, toText } from "@/lib/parse";
import type { RecurringRoute, SaveRecurringRoutePayload } from "./types";

function parseRoute(raw: unknown): RecurringRoute | null {
  if (!isRecord(raw)) return null;
  const id = toInt(raw.id);
  const userId = toInt(raw.userId);
  const departureLocationId = toInt(raw.departureLocationId);
  const arrivalLocationId = toInt(raw.arrivalLocationId);
  const capacity = toInt(raw.capacity);
  if (id == null || userId == null || departureLocationId == null || arrivalLocationId == null || capacity == null) {
    return null;
  }
  return {
    id,
    userId,
    departureLocationId,
    arrivalLocationId,
    weekdays: toText(raw.weekdays),
    departureTime: toText(raw.departureTime),
    capacity,
    tripTypeId: toInt(raw.tripTypeId) ?? 1,
    description: toOptionalText(raw.description),
    departureLocationName: toOptionalText(raw.departureLocationName),
    arrivalLocationName: toOptionalText(raw.arrivalLocationName),
  };
}

function requireRoute(raw: unknown): RecurringRoute {
  const route = parseRoute(raw);
  if (!route) throw new Error("Respuesta de ruta inválida");
  return route;
}

export async function fetchRecurringRoutes(userId: number, signal?: AbortSignal): Promise<RecurringRoute[]> {
  const json = await apiRequest(`/users/${userId}/recurring-routes`, {
    signal,
    fallbackError: "Error al listar rutas",
  });
  return asRecords(json)
    .map(parseRoute)
    .filter((route): route is RecurringRoute => route != null);
}

export async function createRecurringRoute(payload: SaveRecurringRoutePayload): Promise<RecurringRoute> {
  const json = await apiRequest("/recurring-routes", {
    method: "POST",
    body: payload,
    fallbackError: "Error al guardar la ruta",
  });
  return requireRoute(json);
}

export async function updateRecurringRoute(routeId: number, payload: SaveRecurringRoutePayload): Promise<RecurringRoute> {
  const json = await apiRequest(`/recurring-routes/${routeId}`, {
    method: "PUT",
    body: payload,
    fallbackError: "Error al actualizar la ruta",
  });
  return requireRoute(json);
}

export async function deleteRecurringRoute(routeId: number): Promise<string> {
  const message = await apiRequest<string>(`/recurring-routes/${routeId}`, {
    method: "DELETE",
    fallbackError: "Error al eliminar",
  });
  return message || "Ruta eliminada";
}
