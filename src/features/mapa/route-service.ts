import type { LatLngLiteral } from "./types";

/**
 * Ruta en auto con el servicio público de OSRM (OpenStreetMap).
 * Si OSRM no responde, devuelve la línea recta entre origen y destino.
 */
export async function rutaEntre(
  origen: LatLngLiteral,
  destino: LatLngLiteral,
): Promise<LatLngLiteral[]> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origen.lng},${origen.lat};${destino.lng},${destino.lat}` +
    `?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return [origen, destino];
    }
    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{
        geometry?: { coordinates?: Array<[number, number]> };
      }>;
    };
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (data.code !== "Ok" || !coords || coords.length < 2) {
      return [origen, destino];
    }
    return coords.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return [origen, destino];
  }
}
