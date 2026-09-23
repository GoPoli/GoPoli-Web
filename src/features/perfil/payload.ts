export type ProfilePayloadInput = {
  nombre: string;
  correo: string;
  tel: string;
  idCarrera: number;
};

export function buildProfilePayload(input: ProfilePayloadInput) {
  return {
    nombre: input.nombre.trim(),
    correo: input.correo.trim().toLowerCase(),
    tel: input.tel.trim(),
    idCarrera: String(input.idCarrera),
  };
}
