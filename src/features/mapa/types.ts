export type LatLngLiteral = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  position: LatLngLiteral;
  title: string;
  /** green = origen; amber = destino (señal); red = legado */
  color: "green" | "amber" | "red";
};
