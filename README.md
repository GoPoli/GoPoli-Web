# GoPoli Web (PWA)

Aplicación Next.js (App Router + TypeScript) — cliente PWA de GoPoli. Consume el **backend Spring Boot** (`backend/`) y PostgreSQL (Neon, Railway o Docker).

## Requisitos

- Node.js 20+ (recomendado)
- Backend GoPoli en ejecución (local o Railway)
- Variable pública `NEXT_PUBLIC_API_URL` apuntando a la API

## Instalación

```bash
cd web
npm install
```

## Variables de entorno

Crea `web/.env.local` (no subir secretos al repositorio):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Ejemplo contra el backend en Railway (solo la URL pública de la API; JWT y BD siguen en el servidor):

```env
NEXT_PUBLIC_API_URL=https://gopoli-backend.up.railway.app
```

El mapa usa teselas de OpenStreetMap (Leaflet). Las rutas en auto salen de OSRM.

**No** coloques `GOPOLI_JWT_SECRET`, contraseñas de BD ni claves privadas en el cliente.

## Desarrollo

```bash
cd web
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Rutas de perfil implementadas:

| Ruta | Descripción |
|------|-------------|
| `/perfil` | Ver perfil, conductor, historial, cerrar sesión, inhabilitar / eliminar |
| `/perfil/editar` | Editar nombre, correo, teléfono y foto (base64) |
| `/perfil/conductor` | Registro de vehículo / conductor |
| `/perfil/historial` | Últimos 10 viajes finalizados |

## Build de producción

```bash
cd web
npm run build
npm start
```

## Backend

La PWA **no** incluye el API. Arranca Spring Boot (`backend/`) o usa el servicio ya desplegado (p. ej. Railway). La base de datos (Neon/Railway PostgreSQL) la usa solo el backend.

## Comprobar PWA

1. Build + `npm start` (o un host HTTPS).
2. En Chrome → DevTools → Application:
   - **Manifest**: nombre GoPoli, `theme_color` `#1B5E20`, iconos en `/icons/`.
   - **Service Workers**: registrado `/sw.js` (cache de shell; no cachea `/usuario/*` ni datos de viaje en vivo).
3. En Android Chrome: “Instalar aplicación” / Añadir a pantalla de inicio.
4. En iOS Safari: Compartir → Añadir a pantalla de inicio (limitaciones de PWA en iOS).

El componente `PwaRegister` (`src/features/pwa/pwa-register.tsx`) registra el SW solo si `/sw.js` responde; si falla, no rompe la app.

## Notas

- Autenticación: JWT en memoria vía `@/features/auth/session` (`getAccessToken`). No hay recuperación de contraseña en el producto.
- Logout: limpia la sesión en cliente y navega a `/login` (no hay endpoint de logout en el servidor).
