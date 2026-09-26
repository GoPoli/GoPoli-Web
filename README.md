<p align="center">
  <img src="public/icons/gopoli-mark.svg" alt="GoPoli" width="72" />
</p>

<h1 align="center">GoPoli-Web</h1>

<p align="center">
  PWA de GoPoli: viajes compartidos entre estudiantes, instalable en el celular.
</p>

## Estado del Proyecto

[![Node.js CI](https://github.com/GoPoli/GoPoli-Web/actions/workflows/node.js.yml/badge.svg)](https://github.com/GoPoli/GoPoli-Web/actions/workflows/node.js.yml)
[![CodeQL Advanced](https://github.com/GoPoli/GoPoli-Web/actions/workflows/codeql.yml/badge.svg)](https://github.com/GoPoli/GoPoli-Web/actions/workflows/codeql.yml)
[![Publish Package to GHCR](https://github.com/GoPoli/GoPoli-Web/actions/workflows/packaging.yml/badge.svg)](https://github.com/GoPoli/GoPoli-Web/actions/workflows/packaging.yml)
[![Dependabot Updates](https://github.com/GoPoli/GoPoli-Web/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/GoPoli/GoPoli-Web/actions/workflows/dependabot/dependabot-updates)

## Descripción

GoPoli-Web es el cliente de **GoPoli**: una Progressive Web App construida con **Next.js 16** (App Router), **React 19** y **TypeScript**. Un pasajero busca cupo, un conductor publica la salida, la hora y los asientos, y el grupo se encuentra en el mapa, conversa en el chat del viaje y cierra el recorrido al llegar.

La PWA consume la API REST de [GoPoli-API](https://github.com/GoPoli/GoPoli-API). No guarda secretos ni habla con la base de datos: solo necesita la URL pública de la API.

> [!NOTE]
> La PWA reemplazó a la app Flutter original, que se conserva archivada con toda su historia en [GoPoli-Mobile](https://github.com/GoPoli/GoPoli-Mobile).

## Tecnologías Principales

| Capa | Elección | Versión |
| --- | --- | --- |
| Framework | Next.js (App Router, salida `standalone`) | 16.3 |
| Gestor de paquetes | pnpm (fijado en `packageManager`) | 11 |
| UI | React, Tailwind CSS | React 19.2, Tailwind 4 |
| Lenguaje | TypeScript | 5 |
| Mapa | Leaflet + teselas de OpenStreetMap | 1.9 |
| Rutas | OSRM (ruteo en auto) | Servicio público |
| Contenedor | Node.js 22 Alpine | — |

## Funcionalidades

- Registro con correo institucional `@elpoli.edu.co` e inicio de sesión con JWT.
- Publicar un viaje: fecha, hora, origen, destino y cupos.
- Buscar viajes activos, unirse o salir del grupo.
- Registro como conductor con vehículo asociado.
- Mapa con OpenStreetMap y ruta en auto calculada con OSRM.
- Chat del grupo de cada viaje.
- Agenda de rutas habituales.
- Historial de viajes, edición de perfil y foto.
- Instalación como app en Android e iOS.

## Estructura del Proyecto

```text
GoPoli-Web/
├── .github/
│   ├── dependabot.yml              # Actualización de dependencias (pnpm, Docker, Actions)
│   └── workflows/
│       ├── codeql.yml              # Análisis de seguridad CodeQL
│       ├── dependency-review.yml   # Revisión de dependencias en PRs
│       ├── node.js.yml             # Lint, typecheck, pruebas y build con pnpm
│       ├── packaging.yml           # Publicación de la imagen en GHCR (SBOM y provenance)
│       └── stale.yml               # Limpieza de issues y PRs inactivos
│
├── docs/
│   └── DEPLOYMENT.md               # Guía de despliegue de la PWA
│
├── public/                         # Íconos, favicon y service worker (sw.js)
│
├── src/
│   ├── app/
│   │   ├── (auth)/                 # /login, /signup
│   │   ├── (main)/                 # Zona con sesión: mapa, viajes, perfil…
│   │   ├── layout.tsx
│   │   └── manifest.ts             # Manifiesto PWA
│   ├── components/                 # brand, layout, ride, ui
│   ├── config/                     # env.ts (URL de la API), theme.ts
│   ├── features/                   # Un dominio por carpeta: vista, cliente HTTP y tipos
│   └── lib/                        # Cliente HTTP (timeout, token, errores) y utilidades de parseo
│
├── .dockerignore
├── .env.example
├── Dockerfile                      # Imagen multi-etapa con pnpm (deps → build → runtime standalone)
├── entrypoint.sh                   # Inyecta variables públicas en tiempo de arranque
├── runtime.envmap                  # Variables reemplazables en runtime
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml             # Política de scripts de instalación de dependencias
└── LICENSE
```

## Mapa de Pantallas

```text
/                          inicio (redirige a /login)
├── /login                 entrar
├── /signup                crear cuenta
└── zona con sesión
    ├── /map               mapa (?trip=:id muestra la ruta del viaje)
    ├── /trips             mis viajes
    ├── /search            buscar cupo
    ├── /trips/new         publicar salida
    ├── /groups/:id        grupo del viaje
    ├── /schedule          rutas habituales
    ├── /messages          bandeja
    ├── /messages/:id      hilo
    └── /profile
        ├── /edit
        ├── /driver        registro de conductor
        └── /history
```

En `src/features/` cada dominio tiene su vista, su cliente HTTP y sus tipos: `auth`, `map`, `trips`, `groups`, `schedule`, `messages`, `profile`, `driver`, `history`, `catalog` y `pwa`. El código y las rutas están en inglés; todos los textos de la interfaz están en español.

## Guía de Instalación

### Requisitos Previos

- Node.js 22 o superior
- pnpm 11 (`corepack enable` lo activa con la versión fijada en `package.json`)
- Una instancia de [GoPoli-API](https://github.com/GoPoli/GoPoli-API) accesible (local o desplegada)
- Docker (opcional, para contenedorización)

### 1. Ejecución Local

```bash
git clone https://github.com/GoPoli/GoPoli-Web.git
cd GoPoli-Web
cp .env.example .env
corepack enable
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). La API debe responder en la URL configurada en `NEXT_PUBLIC_API_URL`.

### 2. Build de Producción

```bash
pnpm build
pnpm start
```

### 3. Construcción de la Imagen Docker

El `Dockerfile` es multi-etapa: instala dependencias con pnpm y el lockfile congelado, compila la app en modo `standalone` y genera una imagen final mínima que se ejecuta con el usuario sin privilegios `1000`, con `HEALTHCHECK` sobre `/login`. La compilación original queda en `.next-build` y al arrancar se copia a `.next`, lo que permite ejecutar el contenedor con sistema de archivos de solo lectura y `.next` en `tmpfs`.

```bash
docker build --platform linux/amd64 -t ghcr.io/gopoli/gopoli-web:latest .
```

### 4. Ejecución con Docker

```bash
docker run -d --name gopoli-web -p 127.0.0.1:3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080 \
  --read-only --tmpfs /tmp --tmpfs /app/.next:uid=1000,gid=1000 \
  --cap-drop ALL --security-opt no-new-privileges \
  ghcr.io/gopoli/gopoli-web:latest
```

La misma imagen sirve para cualquier entorno: la URL de la API se define al arrancar el contenedor, no al construir la imagen.

### 5. Publicación en GitHub Container Registry

La publicación es automática: cada push a `main` construye la imagen y la publica en `ghcr.io/gopoli/gopoli-web` con las etiquetas `latest` y `sha-<commit>`, junto con su SBOM y la atestación de procedencia. Un tag `vX.Y.Z` publica además `X.Y.Z` y `X.Y`.

### 6. Despliegue

Opciones de hosting, HTTPS y verificación de la PWA en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Para levantar el stack completo (base de datos, API y PWA) usa los entornos de [GoPoli/.github](https://github.com/GoPoli/.github/tree/main/docker).

## Configuración

### Variables de Entorno

| Variable | Alcance | Descripción | Ejemplo |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Cliente (pública) | URL base de la API, sin barra final | `http://localhost:8080` |

`NEXT_PUBLIC_API_URL` es la URL que usa **el navegador** para llamar a la API. En Docker Compose debe ser la dirección publicada en el host (`http://localhost:8080`) o el dominio público, nunca el nombre interno del servicio.

> [!CAUTION]
> No configures en el cliente el secreto JWT ni credenciales de PostgreSQL. Esos valores pertenecen exclusivamente a la API.

### Variables en Tiempo de Arranque (Docker)

Next.js incrusta las variables `NEXT_PUBLIC_*` al compilar. Para publicar una única imagen reutilizable:

1. La imagen se compila con el marcador `__NEXT_PUBLIC_API_URL__`.
2. Al arrancar, `entrypoint.sh` copia la compilación a `.next/`, lee `runtime.envmap` y reemplaza cada marcador por el valor de la variable de entorno correspondiente.
3. Si la variable no está definida, se usa el valor por defecto declarado en `runtime.envmap`.

Formato de `runtime.envmap`:

```text
NOMBRE_VARIABLE=MARCADOR|VALOR_POR_DEFECTO
```

Para exponer otra variable pública en runtime, agrégala a `runtime.envmap` y compílala en el `Dockerfile` con su marcador.

## Autenticación

- `POST /login` devuelve el JWT; la PWA lo guarda **solo en memoria** (nunca en `localStorage`).
- Las rutas protegidas envían `Authorization: Bearer <token>`.
- Recargar la página cierra la sesión. El cierre de sesión es solo del lado del cliente.
- Si una vista protegida se abre sin sesión, el cliente no llama a la API y muestra *Inicia sesión para continuar*.

Detalle de la decisión en [src/features/auth/SECURITY.md](src/features/auth/SECURITY.md).

## PWA

- Manifiesto en `src/app/manifest.ts` con nombre **GoPoli** y `theme_color` `#143528`.
- Service worker `public/sw.js`: cachea solo el *app shell* del mismo origen, nunca respuestas de la API ni datos de viajes en vivo.
- Cabeceras de seguridad en todas las rutas: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` y `Permissions-Policy`; sin cabecera `X-Powered-By`.
- Instalación: Chrome Android → *Instalar aplicación*; iOS Safari → *Compartir* → *Añadir a pantalla de inicio*.

## Testing

```bash
pnpm test
pnpm typecheck
pnpm lint
```

Las pruebas cubren las validaciones de autenticación (correo institucional, contraseña de 8 caracteres a 72 bytes, nombre y teléfono) y el armado del payload de perfil.

## CI/CD

| Workflow | Disparador | Qué hace |
| --- | --- | --- |
| `node.js.yml` | Push y PR a `main` | `pnpm install --frozen-lockfile`, lint, typecheck, pruebas y build en Node 22 y 24 |
| `codeql.yml` | Push, PR y semanal | Análisis estático de seguridad (TypeScript y Actions) |
| `dependency-review.yml` | PR a `main` | Bloquea dependencias con vulnerabilidades conocidas |
| `packaging.yml` | Push a `main`, tags `v*.*.*`, manual | Construye y publica la imagen en GHCR con SBOM y provenance |
| `stale.yml` | Diario | Marca y cierra issues y PRs inactivos |

Dependabot revisa semanalmente las dependencias de pnpm (ecosistema `npm`), la imagen base de Docker y las versiones de las Actions.

## Contribución

Lee la [guía de contribución](https://github.com/GoPoli/.github/blob/main/CONTRIBUTING.md) de la organización.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## Política de Seguridad

Consulta la [política de seguridad](https://github.com/GoPoli/.github/blob/main/SECURITY.md) para reportar vulnerabilidades.

## Autores

- Michael Daniel ([MaicolD0930](https://github.com/MaicolD0930))
- Jorge Martinez ([GeorgeAMS](https://github.com/GeorgeAMS))
- Marian Lasney
- Sebastián López O ([sebastianlopezo](https://github.com/sebastianlopezo))
