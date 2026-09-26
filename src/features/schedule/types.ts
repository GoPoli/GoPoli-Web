export type RecurringRoute = {
  id: number;
  userId: number;
  departureLocationId: number;
  arrivalLocationId: number;
  // Días ISO (1 = lunes … 7 = domingo), p. ej. "1,2,3,4,5".
  weekdays: string;
  departureTime: string;
  capacity: number;
  tripTypeId: number;
  description: string | null;
  departureLocationName: string | null;
  arrivalLocationName: string | null;
};

export type SaveRecurringRoutePayload = {
  departureLocationId: number;
  arrivalLocationId: number;
  weekdays: string;
  departureTime: string;
  capacity: number;
  tripTypeId: number;
  description?: string;
};
