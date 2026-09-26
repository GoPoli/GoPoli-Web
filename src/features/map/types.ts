export type LatLngLiteral = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  position: LatLngLiteral;
  title: string;
  color: "green" | "amber" | "red";
};
