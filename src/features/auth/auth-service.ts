import { ApiException, authRequest, getApiBaseUrl } from "./http";
import { setSession } from "./session";
import {
  parseCarrera,
  parseLoginResponse,
  parseUsuario,
  type Carrera,
  type LoginPayload,
  type LoginResponse,
  type RegisterPayload,
  type Usuario,
} from "./types";

/** POST /register — mirrors Flutter `AuthService.registrar`. */
export async function register(payload: RegisterPayload): Promise<Usuario> {
  try {
    const json = await authRequest<unknown>("/register", {
      method: "POST",
      withAuth: false,
      body: {
        correo: payload.correo.trim(),
        contrasena: payload.contrasena,
        nombre: payload.nombre.trim(),
        tel: payload.tel.trim(),
        idCarrera: payload.idCarrera,
      },
    });
    return parseUsuario(json);
  } catch (err) {
    if (err instanceof ApiException) throw err;
    throw new ApiException(
      `No se pudo conectar con el servidor (${getApiBaseUrl()})`,
    );
  }
}

/** POST /login — mirrors Flutter `AuthService.login` + SessionManager.iniciarSesion. */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const json = await authRequest<unknown>("/login", {
      method: "POST",
      withAuth: false,
      body: {
        correo: payload.correo.trim(),
        contrasena: payload.contrasena,
      },
    });
    const loginResponse = parseLoginResponse(json);
    if (!loginResponse.token) {
      throw new ApiException("Respuesta de login sin token");
    }
    setSession({
      token: loginResponse.token,
      usuario: loginResponse.usuario,
    });
    return loginResponse;
  } catch (err) {
    if (err instanceof ApiException) throw err;
    throw new ApiException(
      `No se pudo conectar con el servidor (${getApiBaseUrl()})`,
    );
  }
}

/** GET /carreras — used by registro (same as Flutter CatalogoService). */
export async function fetchCarreras(): Promise<Carrera[]> {
  try {
    const json = await authRequest<unknown>("/carreras", {
      method: "GET",
      withAuth: false,
    });
    if (!Array.isArray(json)) {
      throw new ApiException("Respuesta de carreras inválida");
    }
    return json.map(parseCarrera);
  } catch (err) {
    if (err instanceof ApiException) throw err;
    throw new ApiException(
      `No se pudo conectar con el servidor (${getApiBaseUrl()})`,
    );
  }
}
