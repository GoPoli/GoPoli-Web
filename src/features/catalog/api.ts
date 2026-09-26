import { apiRequest } from "@/lib/api/client";
import { asRecords, toInt, toNumber, toText, type JsonRecord } from "@/lib/parse";
import type { Location, Program } from "./types";

function parseLocation(raw: JsonRecord): Location | null {
  const id = toInt(raw.id);
  if (id == null) return null;
  return {
    id,
    name: toText(raw.name),
    latitude: toNumber(raw.latitude),
    longitude: toNumber(raw.longitude),
  };
}

function parseProgram(raw: JsonRecord): Program | null {
  const id = toInt(raw.id);
  if (id == null) return null;
  return { id, name: toText(raw.name) };
}

export async function fetchLocations(signal?: AbortSignal): Promise<Location[]> {
  const json = await apiRequest("/locations", {
    auth: false,
    signal,
    fallbackError: "Error al cargar ubicaciones",
  });
  return asRecords(json)
    .map(parseLocation)
    .filter((location): location is Location => location != null);
}

export async function fetchPrograms(signal?: AbortSignal): Promise<Program[]> {
  const json = await apiRequest("/programs", {
    auth: false,
    signal,
    fallbackError: "Error al cargar carreras",
  });
  return asRecords(json)
    .map(parseProgram)
    .filter((program): program is Program => program != null);
}

export function locationLatLng(location: Location): { lat: number; lng: number } | null {
  if (location.latitude == null || location.longitude == null) return null;
  return { lat: location.latitude, lng: location.longitude };
}

export function findLocationById(list: Location[], id: number | null | undefined): Location | null {
  if (id == null) return null;
  return list.find((location) => location.id === id) ?? null;
}
