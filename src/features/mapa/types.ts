export type LatLngLiteral = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  position: LatLngLiteral;
  title: string;
  /** green | red — como Flutter BitmapDescriptor hues */
  color: "green" | "red";
};
