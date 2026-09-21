export type TripTypeKey = "passenger_group" | "driver_group";

export type ServicioEnriquecido = {
  idServicio: number;
  fecha: string;
  descripcion: string | null;
  idLugarSalida: number;
  idLugarLlegada: number;
  horaSalida: string;
  idCreador: number;
  idTipoServicio: number;
  idEstadoServicio: number;
  capacidad: number;
  tripType: TripTypeKey | string;
  tripTypeLabel: string;
};

export type MiembroGrupo = {
  idUsuario: number;
  rol: string;
  rolParticipacion: string | null;
  rolParticipacionLabel: string | null;
  nombreUsuario: string | null;
};

export type CrearServicioPayload = {
  fecha: string;
  descripcion: string;
  idLugarSalida: number;
  idLugarLlegada: number;
  horaSalida: string;
  idCreador: number;
  idTipoServicio: number;
  capacidad: number;
};

export type UnirsePayload = {
  idServicio: number;
  idUsuario: number;
};
