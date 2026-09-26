# Despliegue de GoPoli-Web

La PWA se despliega de forma independiente a la API. Solo necesita conocer la URL pública de [GoPoli-API](https://github.com/GoPoli/GoPoli-API) a través de `NEXT_PUBLIC_API_URL`.

---

## 1. Opciones de Hosting

| Opción | Cómo | Cuándo |
| --- | --- | --- |
| **Imagen de GHCR** | `ghcr.io/gopoli/gopoli-web:latest` en cualquier host de contenedores (VPS, Railway, Render, Fly.io, Kubernetes) | Una sola imagen para todos los entornos |
| **Docker Compose** | Entornos `demo`, `dev` y `production` de [GoPoli/.github](https://github.com/GoPoli/.github/tree/main/docker) | Stack completo en una máquina |
| **Vercel / host Node** | Conectar el repositorio y definir `NEXT_PUBLIC_API_URL` en el proveedor | Despliegue gestionado sin contenedores |

---

## 2. Variables de Entorno

| Variable | Alcance | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Cliente (pública) | URL base de la API, sin barra final. Ej. `https://gopoli-api.up.railway.app` |
| `PORT` | Servidor | Puerto de Next.js. Por defecto `3000` |

- **Con la imagen Docker**, `NEXT_PUBLIC_API_URL` se lee al arrancar el contenedor; cambiarla solo requiere reiniciar con otro valor.
- **Sin Docker** (Vercel, `pnpm build`), la variable se incrusta al compilar; cambiarla requiere un nuevo build.

No configures secretos de JWT ni credenciales de PostgreSQL en la PWA.

---

## 3. Despliegue con la Imagen de GHCR

```bash
docker pull ghcr.io/gopoli/gopoli-web:latest
docker run -d --name gopoli-web -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://gopoli-api.up.railway.app \
  --restart unless-stopped \
  ghcr.io/gopoli/gopoli-web:latest
```

La imagen es pública: no hace falta iniciar sesión en GHCR.

---

## 4. Despliegue sin Contenedores

```bash
corepack enable
pnpm install --frozen-lockfile
NEXT_PUBLIC_API_URL=https://gopoli-api.up.railway.app pnpm build
pnpm start
```

---

## 5. Dominio y HTTPS

- Asigna un dominio al host de la PWA.
- **HTTPS es obligatorio** para el service worker y para instalar la app en navegadores modernos.
- Detrás de un proxy reverso (Nginx, Traefik, Caddy) expón el puerto `3000` y termina TLS en el proxy.
- La API puede vivir en otro dominio; la PWA envía `Authorization: Bearer <token>` y la API admite CORS.

---

## 6. Verificación de la PWA

Checklist tras desplegar en HTTPS:

- [ ] `GET {NEXT_PUBLIC_API_URL}/locations` responde desde el navegador (sin error de CORS).
- [ ] `https://<dominio>/manifest.webmanifest` muestra el nombre **GoPoli** y `theme_color` `#143528`.
- [ ] Los íconos `/icons/icon-192.png`, `/icons/icon-512.png` y `/icons/apple-touch-icon.png` cargan y muestran el logo de GoPoli.
- [ ] El service worker `/sw.js` queda registrado y Cache Storage solo contiene el *app shell*.
- [ ] *Instalar aplicación* funciona en Chrome Android; en iOS desde *Compartir* → *Añadir a pantalla de inicio*.
- [ ] Tras instalar, el inicio de sesión y el perfil funcionan contra la API real.

---

## 7. Actualizaciones

1. Merge a `main`: el workflow `packaging.yml` publica una nueva imagen `latest` y `sha-<commit>`.
2. En el host: `docker pull` y reiniciar el contenedor (o redeploy del proveedor).
3. Para forzar la limpieza del caché del *app shell* en los clientes, incrementa `CACHE_NAME` en `public/sw.js`.
4. Si solo cambió la PWA no hace falta redesplegar la API.

---

## Responsabilidades

| Pieza | Repositorio | Imagen |
| --- | --- | --- |
| PWA Next.js | [GoPoli-Web](https://github.com/GoPoli/GoPoli-Web) | `ghcr.io/gopoli/gopoli-web` |
| API Spring Boot | [GoPoli-API](https://github.com/GoPoli/GoPoli-API) | `ghcr.io/gopoli/gopoli-api` |
| PostgreSQL | [GoPoli-DB](https://github.com/GoPoli/GoPoli-DB) | `ghcr.io/gopoli/gopoli-db` |
