"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button, EmptyState, Spinner, TextField } from "@/components/ui";
import { getSessionUserId } from "@/features/auth/session";
import { ApiError } from "@/lib/api/client";
import { fetchMessages, sendMessage } from "./api";
import type { Message } from "./types";

export type MessageThreadViewProps = {
  tripId: number;
};

const AUTO_REFRESH_MS = 4000;

function formatTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function MessageThreadView({ tripId }: MessageThreadViewProps) {
  const sessionUserId = getSessionUserId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const noSession = sessionUserId == null;
  const visibleError = noSession ? "No hay sesión activa" : error;
  const visibleLoading = loading && !noSession;

  const query = useCallback(
    (showError: boolean) => {
      if (noSession) return Promise.resolve();
      return fetchMessages(tripId)
        .then((list) => {
          setMessages(list);
          setError(null);
        })
        .catch((e: unknown) => {
          if (showError) setError(e instanceof ApiError ? e.message : "Error de conexión");
        })
        .finally(() => setLoading(false));
    },
    [tripId, noSession],
  );

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return query(true);
  }, [query]);

  useEffect(() => {
    void query(true);
    const timer = window.setInterval(() => void query(false), AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [query]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (noSession || sending) return;
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      const created = await sendMessage(tripId, content);
      setMessages((prev) => [...prev, created]);
      setDraft("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col bg-[var(--gopoli-paper,#F7FBF8)] md:my-6 md:rounded-2xl md:border md:border-[var(--gopoli-border,#E0E0E0)] md:bg-white">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--gopoli-border,#E0E0E0)] px-4 py-3 md:px-6">
        <div>
          <h1 className="text-lg font-bold text-[var(--gopoli-primary,#1B5E20)]">Chat del grupo</h1>
          <p className="text-xs text-[var(--gopoli-text-muted,#757575)]">Servicio #{tripId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/groups/${tripId}`}
            className="text-sm font-medium text-[var(--gopoli-primary,#1B5E20)] underline-offset-2 hover:underline"
          >
            Ver grupo
          </Link>
          <Link
            href="/messages"
            className="text-sm text-[var(--gopoli-text-muted,#757575)] underline-offset-2 hover:underline"
          >
            Volver
          </Link>
        </div>
      </div>

      {visibleLoading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner label="Cargando mensajes…" />
        </div>
      ) : visibleError && messages.length === 0 ? (
        <EmptyState title={visibleError} action={<Button onClick={() => void reload()}>Reintentar</Button>} />
      ) : (
        <>
          <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 md:p-6">
            {messages.length === 0 ? (
              <EmptyState title="Aún no hay mensajes" description="Escribe algo para coordinar con tu grupo." />
            ) : (
              messages.map((m) => {
                const mine = m.userId === sessionUserId;
                return (
                  <div key={m.id} className={["flex", mine ? "justify-end" : "justify-start"].join(" ")}>
                    <div
                      className={[
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                        mine
                          ? "bg-[var(--gopoli-primary,#1B5E20)] text-white"
                          : "bg-[#F5F5F5] text-[var(--foreground,#171717)]",
                      ].join(" ")}
                    >
                      {!mine ? (
                        <p className="mb-0.5 text-[11px] font-semibold text-[var(--gopoli-primary,#1B5E20)]">
                          {m.userName ?? "Usuario"}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap break-words text-sm leading-snug">{m.content}</p>
                      <p
                        className={[
                          "mt-1 text-right text-[10px]",
                          mine ? "text-white/70" : "text-[var(--gopoli-text-muted,#757575)]",
                        ].join(" ")}
                      >
                        {formatTime(m.sentAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {visibleError && messages.length > 0 ? (
            <p className="shrink-0 px-4 text-sm text-red-600 md:px-6" role="alert">
              {visibleError}
            </p>
          ) : null}

          <form
            onSubmit={(e) => void onSend(e)}
            className="flex shrink-0 items-end gap-2 border-t border-[var(--gopoli-border,#E0E0E0)] bg-inherit p-3 md:rounded-b-2xl md:p-4"
          >
            <div className="min-w-0 flex-1">
              <TextField
                aria-label="Escribe un mensaje"
                placeholder="Escribe un mensaje…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={1000}
                disabled={sending || noSession}
                fullWidth
              />
            </div>
            <Button type="submit" disabled={sending || !draft.trim() || noSession}>
              {sending ? "…" : "Enviar"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
