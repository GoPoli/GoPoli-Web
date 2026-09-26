export type ProfilePayloadInput = {
  name: string;
  email: string;
  phone: string;
  programId: number;
};

export function buildProfilePayload(input: ProfilePayloadInput) {
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    programId: input.programId,
  };
}
