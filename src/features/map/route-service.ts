import type { LatLngLiteral } from "./types";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

type OsrmResponse = {
  code?: string;
  routes?: Array<{ geometry?: { coordinates?: Array<[number, number]> } }>;
};

// Ruta en auto con el servicio público de OSRM; si no responde, se usa la línea recta.
export async function routeBetween(origin: LatLngLiteral, destination: LatLngLiteral): Promise<LatLngLiteral[]> {
  const url =
    `${OSRM_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [origin, destination];
    const data = (await res.json()) as OsrmResponse;
    const coordinates = data.routes?.[0]?.geometry?.coordinates;
    if (data.code !== "Ok" || !coordinates || coordinates.length < 2) {
      return [origin, destination];
    }
    return coordinates.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return [origin, destination];
  }
}
