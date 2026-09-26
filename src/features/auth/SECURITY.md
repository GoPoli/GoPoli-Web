# Seguridad de la sesión

## Dónde vive el token

La API devuelve el JWT en el cuerpo de `POST /login` y espera `Authorization: Bearer <token>` en las rutas protegidas. No emite cookies `httpOnly`.

- El JWT **no** se guarda en `localStorage` ni en `sessionStorage`: un script inyectado podría leerlo.
- La opción ideal serían cookies `httpOnly` + `Secure` + `SameSite`, pero requiere cambios en la API.
- **Enfoque actual:** el token vive solo en memoria (`session.ts` + contexto de React).

## Consecuencias

Como el token está solo en memoria:

- Recargar la página, abrir otra pestaña o reiniciar el navegador **cierra la sesión**.
- Hay que iniciar sesión de nuevo con `POST /login`.
- La navegación dentro de la app (sin recargar) conserva la sesión.

No existe recuperación de contraseña ni cierre de sesión en el servidor: cerrar sesión limpia la memoria del cliente (`clearSession`) y lleva a `/login`.
