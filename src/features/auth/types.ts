import { isRecord, toInt, toNumber, toOptionalText, toText } from "@/lib/parse";

export const USER_TYPE_DRIVER = 2;

export type Vehicle = {
  id: number | null;
  brand: string;
  model: string;
  color: string;
  plate: string;
};

export type User = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  programId: number | null;
  userTypeId: number | null;
  statusId: number | null;
  rating: number | null;
  profilePhoto: string | null;
  isDriver: boolean;
  vehicle: Vehicle | null;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  phone: string;
  programId: number;
};

export function parseVehicle(json: unknown): Vehicle | null {
  if (!isRecord(json)) return null;
  return {
    id: toInt(json.id),
    brand: toText(json.brand),
    model: toText(json.model),
    color: toText(json.color),
    plate: toText(json.plate),
  };
}

export function parseUser(json: unknown): User {
  if (!isRecord(json)) {
    throw new Error("Respuesta de usuario inválida");
  }
  const userTypeId = toInt(json.userTypeId);
  return {
    id: toInt(json.id) ?? 0,
    email: toText(json.email),
    name: toText(json.name),
    phone: toOptionalText(json.phone),
    programId: toInt(json.programId),
    userTypeId,
    statusId: toInt(json.statusId),
    rating: toNumber(json.rating),
    profilePhoto: toOptionalText(json.profilePhoto),
    isDriver: json.driver === true || userTypeId === USER_TYPE_DRIVER,
    vehicle: parseVehicle(json.vehicle),
  };
}

export function parseLoginResponse(json: unknown): LoginResponse {
  if (!isRecord(json) || !isRecord(json.user)) {
    throw new Error("Respuesta de login inválida");
  }
  return { token: toText(json.token), user: parseUser(json.user) };
}
