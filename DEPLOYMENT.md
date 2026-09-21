# Despliegue de la PWA GoPoli (`web/`)

La PWA es un **host Node.js separado** del backend. En este repositorio, Railway (y Neon) están documentados para el **API Spring Boot y la base de datos**. No asumas que la PWA vive en el mismo servicio Railway del backend: despliega Next.js en su propio host (Vercel, Railway como servicio Node, o similar) y apunta `NEXT_PUBLIC_API_URL` a la URL pública del API.

## 1. Instalar

```bash
cd web
npm install
```

## 2. Variables de entorno

| Variable | Alcance | Descripción |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Cliente (pública) | Base URL del backend, sin barra final. Ej. `https://gopoli-backend.up.railway.app` |

No configures secretos de JWT ni credenciales de PostgreSQL en el front. Esas claves pertenecen al backend (`GOPOLI_JWT_SECRET`, `SPRING_DATASOURCE_*`); ver `DEPLOY_RAILWAY.md` y `DATABASE_NEON.md` en la raíz del repo.

Ejemplo `.env.production` / variables del host Node:

```env
NEXT_PUBLIC_API_URL=https://gopoli-backend.up.railway.app
```

## 3. Build

```bash
cd web
npm run build
```

## 4. Arranque

```bash
cd web
npm start
```

Por defecto Next escucha el puerto 3000 (o el `PORT` que inyecte el host).

## 5. Dominio y HTTPS

- Asigna un dominio al host de la PWA.
- **HTTPS es obligatorio** para service worker e “instalar app” en navegadores modernos.
- El backend puede seguir en otro dominio (p. ej. `*.up.railway.app`); el cliente envía `Authorization: Bearer …`. CORS del backend ya permite orígenes con `@CrossOrigin("*")` (restringir en producción cuando se decida).

## 6. Conexión al backend

1. Verifica salud del API: `GET {NEXT_PUBLIC_API_URL}/ubicaciones` (o `/carreras`).
2. Login desde la PWA (`POST /login`) → token en memoria.
3. Perfil y cuenta usan Bearer en:
   - `GET/PUT /usuario/me`
   - `PUT /usuario/me/foto`
   - `POST /usuario/me/register-driver` / `unregister-driver`
   - `GET /usuario/me/historial-viajes`
   - `POST /usuario/me/inhabilitar`
   - `DELETE /usuario/me`

## 7. Verificación PWA

Checklist tras desplegar en HTTPS:

- [ ] `https://<tu-dominio>/manifest.webmanifest` (o la ruta de metadata de Next) muestra nombre **GoPoli** y `theme_color` `#1B5E20`.
- [ ] Iconos `/icons/Icon-192.png` y `/icons/Icon-512.png` cargan.
- [ ] Service worker `/sw.js` registrado; Application → Cache Storage tiene solo shell (no respuestas de `/usuario/me` ni listas de viajes).
- [ ] “Instalar” / Añadir a inicio funciona en Chrome Android; en iOS vía menú Compartir.
- [ ] Tras instalar, login y perfil siguen hablando al backend real (red online).

## 8. Actualizaciones

1. Sube cambios al repo / pipeline del host Node.
2. `npm run build` + reinicio del proceso `next start` (o redeploy del proveedor).
3. Los clientes reciben el nuevo shell en la siguiente visita; el SW `gopoli-shell-v1` se puede versionar cambiando `CACHE_NAME` en `public/sw.js` cuando quieras forzar limpieza de cache de shell.
4. No hace falta redeploy del backend si solo cambió la PWA (salvo que también hayas cambiado la API).

## Resumen de responsabilidades

| Pieza | Dónde |
|-------|--------|
| PWA Next.js | Host Node propio (`web/`) |
| API Spring Boot | p. ej. Railway (`backend/`) |
| PostgreSQL | Neon o Railway Postgres |

Stack del repo: PWA en `web/`, API en `backend/`, PostgreSQL (Neon / Railway / Docker).
