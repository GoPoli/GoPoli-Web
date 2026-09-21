export type RutaHabitual = {
  idRuta: number;
  idUsuario: number;
  idLugarSalida: number;
  idLugarLlegada: number;
  /** ISO 1=lun … 7=dom, p. ej. "1,2,3,4,5" */
  diasSemana: string;
  horaSalida: string;
  capacidad: number;
  idTipoServicio: number;
  descripcion: string | null;
  nombreSalida: string | null;
  nombreLlegada: string | null;
};

export type GuardarRutaHabitualPayload = {
  idUsuario: number;
  idLugarSalida: number;
  idLugarLlegada: number;
  diasSemana: string;
  horaSalida: string;
  capacidad: number;
  idTipoServicio: number;
  descripcion?: string;
};
