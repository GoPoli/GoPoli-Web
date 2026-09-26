export type TripTypeKey = "passenger_group" | "driver_group";

export type Trip = {
  id: number;
  departureDate: string;
  description: string | null;
  departureLocationId: number;
  arrivalLocationId: number;
  departureTime: string;
  creatorId: number;
  tripTypeId: number;
  statusId: number;
  capacity: number;
  tripType: TripTypeKey | string;
  tripTypeLabel: string;
};

export type TripMember = {
  userId: number;
  groupRole: string;
  participationRole: string | null;
  participationRoleLabel: string | null;
  userName: string | null;
};

export type CreateTripPayload = {
  departureDate: string;
  description: string;
  departureLocationId: number;
  arrivalLocationId: number;
  departureTime: string;
  tripTypeId: number;
  capacity: number;
};
