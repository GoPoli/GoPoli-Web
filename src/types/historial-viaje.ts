/** Mirrors frontend ParticipanteHistorial. */
export interface ParticipanteHistorial {
  nombreUsuario: string;
  rolParticipacionLabel: string;
}

/** Mirrors frontend HistorialViaje (historial-viajes API payload). */
export interface HistorialViaje {
  idServicio: number;
  fecha?: string | null;
  horaSalida?: string | null;
  descripcion?: string | null;
  tripType?: string | null;
  tripTypeLabel?: string | null;
  nombreSalida?: string | null;
  nombreLlegada?: string | null;
  miRolParticipacionLabel?: string | null;
  participantes: ParticipanteHistorial[];
}
