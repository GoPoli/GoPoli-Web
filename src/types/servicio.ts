/**
 * Mirrors backend Servicio entity JSON fields.
 * Flutter has no typed Servicio model; fields taken from Java entity getters.
 */
export interface Servicio {
  idServicio?: number | null;
  fecha?: string | null;
  descripcion?: string | null;
  idLugarSalida?: number | null;
  idLugarLlegada?: number | null;
  horaSalida?: string | null;
  idCreador?: number | null;
  idTipoServicio?: number | null;
  idEstadoServicio?: number | null;
  capacidad?: number | null;
}
