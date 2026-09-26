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
> Este repositorio conserva la historia completa del cliente. Hasta septiembre de 2026 fue una aplicación Flutter; desde el commit *Sustituye el cliente Flutter por la PWA* es la PWA Next.js actual.

## Tecnologías Principales

| Capa | Elección | Versión |
| --- | --- | --- |
| Framework | Next.js (App Router, salida `standalone`) | 16.3 |
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
│   ├── dependabot.yml              # Actualización de dependencias (npm, Docker, Actions)
│   └── workflows/
│       ├── codeql.yml              # Análisis de seguridad CodeQL
│       ├── dependency-review.yml   # Revisión de dependencias en PRs
│       ├── node.js.yml             # Lint, typecheck, pruebas y build
│       ├── packaging.yml           # Publicación de la imagen en GHCR
│       └── stale.yml               # Limpieza de issues y PRs inactivos
│
├── docs/
│   └── DEPLOYMENT.md               # Guía de despliegue de la PWA
│
├── public/                         # Íconos, favicon y service worker (sw.js)
│
├── src/
│   ├── app/
│   │   ├── (auth)/                 # /login, /registro
│   │   ├── (main)/                 # Zona con sesión: mapa, viajes, perfil…
│   │   ├── layout.tsx
│   │   └── manifest.ts             # Manifiesto PWA
│   ├── components/                 # brand, layout, ride, ui
│   ├── config/                     # env.ts (URL de la API), theme.ts
│   ├── features/                   # Un dominio por carpeta: vista, cliente HTTP y tipos
│   ├── lib/api/                    # Encabezados y excepciones HTTP
│   ├── services/api/               # Cliente fetch tipado
│   └── types/
│
├── .dockerignore
├── .env.example
├── Dockerfile                      # Imagen multi-etapa (build → runtime standalone)
├── entrypoint.sh                   # Inyecta variables públicas en tiempo de arranque
├── runtime.envmap                  # Variables reemplazables en runtime
├── next.config.ts
├── package.json
└── LICENSE
```

## Mapa de Pantallas

```text
/                          inicio
├── /login                 entrar
├── /registro              crear cuenta
└── zona con sesión
    ├── /mapa              mapa
    ├── /viajes            mis viajes
    ├── /buscar            buscar cupo
    ├── /servicio/nuevo    publicar salida
    ├── /grupo/:id         grupo del viaje
    ├── /agenda            rutas habituales
    ├── /mensajes          bandeja
    ├── /mensajes/:id      hilo
    └── /perfil
        ├── /editar
        ├── /conductor     registro de conductor
        └── /historial
```

En `src/features/` cada dominio tiene su vista, su cliente HTTP y sus tipos: `auth`, `mapa`, `viajes`, `servicios`, `grupos`, `agenda`, `mensajes`, `perfil`, `conductor`, `historial`, `catalogo` y `pwa`.

## Guía de Instalación

### Requisitos Previos

- Node.js 22 o superior
- npm 10+
- Una instancia de [GoPoli-API](https://github.com/GoPoli/GoPoli-API) accesible (local o desplegada)
- Docker (opcional, para contenedorización)

### 1. Ejecución Local

```bash
git clone https://github.com/GoPoli/GoPoli-Web.git
cd GoPoli-Web
cp .env.example .env.local
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La API debe responder en la URL configurada en `NEXT_PUBLIC_API_URL`.

### 2. Build de Producción

```bash
npm run build
npm start
```

### 3. Construcción de la Imagen Docker

El `Dockerfile` es multi-etapa: instala dependencias, compila la app en modo `standalone` y genera una imagen final mínima que se ejecuta con el usuario sin privilegios `node`.

```bash
docker build --platform linux/amd64 -t ghcr.io/gopoli/gopoli-web:latest .
```

### 4. Ejecución con Docker

```bash
docker run -d --name gopoli-web -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080 \
  ghcr.io/gopoli/gopoli-web:latest
```

La misma imagen sirve para cualquier entorno: la URL de la API se define al arrancar el contenedor, no al construir la imagen.

### 5. Publicación en GitHub Container Registry

La publicación es automática: cada push a `main` construye la imagen y la publica en `ghcr.io/gopoli/gopoli-web` con las etiquetas `latest` y `sha-<commit>`. Un tag `vX.Y.Z` publica además `X.Y.Z` y `X.Y`.

Publicación manual (requiere un token con `write:packages`):

```bash
echo $GHCR_TOKEN | docker login ghcr.io -u <usuario> --password-stdin
docker push ghcr.io/gopoli/gopoli-web:latest
```

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
2. Al arrancar, `entrypoint.sh` lee `runtime.envmap` y reemplaza cada marcador en `.next/` por el valor de la variable de entorno correspondiente.
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

Detalle de la decisión en [src/features/auth/SECURITY.md](src/features/auth/SECURITY.md).

## PWA

- Manifiesto en `src/app/manifest.ts` con nombre **GoPoli** y `theme_color` `#143528`.
- Service worker `public/sw.js`: cachea solo el *app shell*, nunca respuestas de la API ni datos de viajes en vivo.
- Instalación: Chrome Android → *Instalar aplicación*; iOS Safari → *Compartir* → *Añadir a pantalla de inicio*.

## Testing

```bash
npm test
npm run typecheck
npm run lint
```

Las pruebas cubren las validaciones de autenticación y el armado del payload de perfil.

## CI/CD

| Workflow | Disparador | Qué hace |
| --- | --- | --- |
| `node.js.yml` | Push y PR a `main` | Lint, typecheck, pruebas y build en Node 22 y 24 |
| `codeql.yml` | Push, PR y semanal | Análisis estático de seguridad (TypeScript y Actions) |
| `dependency-review.yml` | PR a `main` | Bloquea dependencias con vulnerabilidades conocidas |
| `packaging.yml` | Push a `main`, tags `v*.*.*`, manual | Construye y publica la imagen en GHCR |
| `stale.yml` | Diario | Marca y cierra issues y PRs inactivos |

Dependabot revisa semanalmente npm, la imagen base de Docker y las versiones de las Actions.

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
