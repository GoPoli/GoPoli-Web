/** Mirrors backend Ubicacion entity. */
export interface Ubicacion {
  idUbicacion: number;
  nombreUbicacion: string;
  latitud?: number | null;
  longitud?: number | null;
}
