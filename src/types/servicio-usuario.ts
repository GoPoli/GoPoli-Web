/** Mirrors backend ServicioUsuario membership row. */
export interface ServicioUsuario {
  idServicio: number;
  idUsuario: number;
  rol?: string | null;
  rolParticipacion?: string | null;
}
