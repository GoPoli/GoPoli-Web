export type Message = {
  id: number;
  tripId: number;
  userId: number;
  content: string;
  sentAt: string;
  userName: string | null;
};
