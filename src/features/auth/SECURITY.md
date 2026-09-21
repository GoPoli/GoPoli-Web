# Auth security notes (GoPoli PWA)

## Token storage decision

The Spring Boot backend returns the JWT in the JSON body of `POST /login` and expects `Authorization: Bearer <token>` on protected routes. It does **not** set httpOnly cookies.

Per `MIGRATION_PLAN.md` §19 / §22 / §26:

- **Do not** store the JWT (or other secrets) in `localStorage`.
- Ideal: httpOnly + Secure + SameSite cookies (requires a backend change — out of scope for this module).
- **Current approach:** keep the access token **in memory only** (React context + module session store).

## Reload / refresh limitation

Because the token lives only in memory:

- A full page reload, new tab, or browser restart **clears the session**.
- The user must sign in again (`POST /login`).
- Client-side navigations within the same SPA session keep the token.

There is **no** password recovery endpoint and **no** server logout endpoint; logout is client-side only (`clearSession` → `/login`).
