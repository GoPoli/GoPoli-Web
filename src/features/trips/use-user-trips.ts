"use client";

import { useCallback, useEffect, useState } from "react";
import { getSessionUserId, subscribeSession } from "@/features/auth/session";
import { fetchActiveTripId, fetchTripInProgress } from "./api";

export type UserTrips = {
  activeTripId: number | null;
  inProgressTripId: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type UserTripsResult =
  | { kind: "no-session" }
  | { kind: "error"; message: string }
  | { kind: "ok"; activeTripId: number | null; inProgressTripId: number | null };

async function loadUserTrips(): Promise<UserTripsResult> {
  const userId = getSessionUserId();
  if (userId == null) {
    return { kind: "no-session" };
  }
  try {
    const [activeTripId, inProgress] = await Promise.all([
      fetchActiveTripId(userId),
      fetchTripInProgress(userId),
    ]);
    return { kind: "ok", activeTripId, inProgressTripId: inProgress?.id ?? null };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : "Error al cargar viajes" };
  }
}

// Grupo en planificación y viaje en curso del usuario en sesión.
export function useUserTrips(): UserTrips {
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [inProgressTripId, setInProgressTripId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((result: UserTripsResult) => {
    if (result.kind === "ok") {
      setActiveTripId(result.activeTripId);
      setInProgressTripId(result.inProgressTripId);
      setError(null);
    } else if (result.kind === "no-session") {
      setActiveTripId(null);
      setInProgressTripId(null);
      setError("No hay sesión activa");
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    if (getSessionUserId() != null) {
      setLoading(true);
      setError(null);
    }
    return loadUserTrips().then(apply);
  }, [apply]);

  useEffect(() => {
    void loadUserTrips().then(apply);
    return subscribeSession(() => {
      void refresh();
    });
  }, [apply, refresh]);

  return { activeTripId, inProgressTripId, loading, error, refresh };
}
