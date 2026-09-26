"use client";

import { use } from "react";
import { MessageThreadView } from "@/features/messages";

type MessageThreadPageProps = {
  params: Promise<{ id: string }>;
};

export default function MessageThreadPage({ params }: MessageThreadPageProps) {
  const { id } = use(params);
  const tripId = Number.parseInt(id, 10);

  if (!Number.isFinite(tripId)) {
    return (
      <p className="p-6 text-center text-sm text-red-600" role="alert">
        Identificador de chat no válido.
      </p>
    );
  }

  return <MessageThreadView tripId={tripId} />;
}
