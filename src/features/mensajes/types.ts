export type Mensaje = {
  idMensaje: number;
  idServicio: number;
  idUsuario: number;
  texto: string;
  fechaEnvio: string;
  nombreUsuario: string | null;
};
