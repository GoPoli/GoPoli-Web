import { apiRequest } from "@/lib/api/client";
import { clearSession, updateSessionUser } from "@/features/auth/session";
import { parseUser, type User } from "@/features/auth/types";
import { buildProfilePayload, type ProfilePayloadInput } from "./payload";
import { parseTripHistoryItem, type TripHistoryItem } from "./types";

async function userRequest(path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: unknown): Promise<User> {
  const json = await apiRequest(`/users/me${path}`, { method, body });
  const user = parseUser(json);
  updateSessionUser(user);
  return user;
}

export function fetchProfile(): Promise<User> {
  return userRequest("");
}

export function updateProfile(input: ProfilePayloadInput): Promise<User> {
  return userRequest("", "PUT", buildProfilePayload(input));
}

export function uploadProfilePhoto(photoBase64: string): Promise<User> {
  return userRequest("/photo", "PUT", { photoBase64 });
}

export function registerAsDriver(input: { brand: string; model: string; color: string; plate: string }): Promise<User> {
  return userRequest("/driver", "POST", {
    brand: input.brand.trim(),
    model: input.model.trim(),
    color: input.color.trim(),
    plate: input.plate.trim().toUpperCase(),
  });
}

export function unregisterAsDriver(): Promise<User> {
  return userRequest("/driver", "DELETE");
}

export async function fetchTripHistory(signal?: AbortSignal): Promise<TripHistoryItem[]> {
  const json = await apiRequest("/users/me/trip-history", { signal });
  return Array.isArray(json) ? json.map(parseTripHistoryItem) : [];
}

export async function deactivateAccount(): Promise<void> {
  await apiRequest("/users/me/deactivate", { method: "POST" });
  clearSession();
}

export async function deleteAccount(): Promise<void> {
  await apiRequest("/users/me", { method: "DELETE" });
  clearSession();
}
