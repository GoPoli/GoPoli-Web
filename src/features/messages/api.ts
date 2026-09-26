import { apiRequest } from "@/lib/api/client";
import { asRecords, isRecord, toInt, toOptionalText, toText } from "@/lib/parse";
import type { Message } from "./types";

function parseMessage(raw: unknown): Message | null {
  if (!isRecord(raw)) return null;
  const id = toInt(raw.id);
  const tripId = toInt(raw.tripId);
  const userId = toInt(raw.userId);
  if (id == null || tripId == null || userId == null) return null;
  return {
    id,
    tripId,
    userId,
    content: toText(raw.content),
    sentAt: toText(raw.sentAt),
    userName: toOptionalText(raw.userName),
  };
}

export async function fetchMessages(tripId: number, signal?: AbortSignal): Promise<Message[]> {
  const json = await apiRequest(`/trips/${tripId}/messages`, {
    signal,
    fallbackError: "Error al listar mensajes",
  });
  return asRecords(json)
    .map(parseMessage)
    .filter((message): message is Message => message != null);
}

export async function sendMessage(tripId: number, content: string): Promise<Message> {
  const json = await apiRequest(`/trips/${tripId}/messages`, {
    method: "POST",
    body: { content },
    fallbackError: "Error al enviar mensaje",
  });
  const message = parseMessage(json);
  if (!message) throw new Error("Respuesta de mensaje inválida");
  return message;
}
