import { ApiError, apiRequest } from "@/lib/api/client";
import { setSession } from "./session";
import {
  parseLoginResponse,
  parseUser,
  type LoginPayload,
  type LoginResponse,
  type RegisterPayload,
  type User,
} from "./types";

export async function register(payload: RegisterPayload): Promise<User> {
  const json = await apiRequest("/register", {
    method: "POST",
    auth: false,
    body: {
      email: payload.email.trim(),
      password: payload.password,
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      programId: payload.programId,
    },
  });
  return parseUser(json);
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const json = await apiRequest("/login", {
    method: "POST",
    auth: false,
    body: { email: payload.email.trim(), password: payload.password },
  });
  const response = parseLoginResponse(json);
  if (!response.token) {
    throw new ApiError("Respuesta de inicio de sesión sin token");
  }
  setSession({ token: response.token, user: response.user });
  return response;
}
