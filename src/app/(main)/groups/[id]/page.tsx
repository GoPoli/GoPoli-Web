"use client";

import { use } from "react";
import { GroupView } from "@/features/groups";

type GroupPageProps = {
  params: Promise<{ id: string }>;
};

export default function GroupPage({ params }: GroupPageProps) {
  const { id } = use(params);
  const tripId = Number.parseInt(id, 10);

  if (!Number.isFinite(tripId)) {
    return (
      <p className="p-6 text-center text-sm text-red-600" role="alert">
        Identificador de grupo no válido.
      </p>
    );
  }

  return <GroupView tripId={tripId} />;
}
