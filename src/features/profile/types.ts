import { isRecord, toInt, toOptionalText, toText } from "@/lib/parse";
import type { User } from "@/features/auth/types";

export type TripHistoryParticipant = {
  userName: string;
  participationRoleLabel: string;
};

export type TripHistoryItem = {
  tripId: number;
  departureDate: string | null;
  departureTime: string | null;
  description: string | null;
  tripType: string | null;
  tripTypeLabel: string | null;
  departureLocationName: string | null;
  arrivalLocationName: string | null;
  myParticipationRoleLabel: string | null;
  participants: TripHistoryParticipant[];
};

function parseParticipant(json: unknown): TripHistoryParticipant {
  if (!isRecord(json)) {
    return { userName: "Usuario", participationRoleLabel: "Pasajero" };
  }
  return {
    userName: toText(json.userName, "Usuario"),
    participationRoleLabel: toText(json.participationRoleLabel, "Pasajero"),
  };
}

export function parseTripHistoryItem(json: unknown): TripHistoryItem {
  if (!isRecord(json)) {
    throw new Error("Respuesta de historial inválida");
  }
  return {
    tripId: toInt(json.tripId) ?? 0,
    departureDate: toOptionalText(json.departureDate),
    departureTime: toOptionalText(json.departureTime),
    description: toOptionalText(json.description),
    tripType: toOptionalText(json.tripType),
    tripTypeLabel: toOptionalText(json.tripTypeLabel),
    departureLocationName: toOptionalText(json.departureLocationName),
    arrivalLocationName: toOptionalText(json.arrivalLocationName),
    myParticipationRoleLabel: toOptionalText(json.myParticipationRoleLabel),
    participants: Array.isArray(json.participants) ? json.participants.map(parseParticipant) : [],
  };
}

export function userTypeLabel(user: User): string {
  return user.isDriver ? "Conductor" : "Pasajero";
}
