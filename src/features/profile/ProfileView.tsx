"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmModal, ProfileAvatar, RatingBadge, Spinner } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { getSessionUser } from "@/features/auth/session";
import type { User } from "@/features/auth/types";
import { ApiError } from "@/lib/api/client";
import { deactivateAccount, deleteAccount, fetchProfile, unregisterAsDriver } from "./api";
import { userTypeLabel } from "./types";

type ConfirmKind = null | "deactivate" | "delete-step-1" | "delete-step-2" | "stop-driving";

type Toast = { message: string; tone: "ok" | "err" };

export function ProfileView() {
  const router = useRouter();
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [busy, setBusy] = useState(false);

  const query = useCallback(
    () =>
      fetchProfile()
        .then(setUser)
        .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "No se pudo cargar el perfil"))
        .finally(() => setLoading(false)),
    [],
  );

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return query();
  }, [query]);

  useEffect(() => {
    void query();
  }, [query]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  function showToast(message: string, tone: Toast["tone"] = "err") {
    setToast({ message, tone });
  }

  const sessionUser = getSessionUser();
  const isDriver = user?.isDriver === true || sessionUser?.isDriver === true;

  async function confirmAction() {
    if (confirm === "delete-step-1") {
      setConfirm("delete-step-2");
      return;
    }
    setBusy(true);
    try {
      if (confirm === "deactivate") {
        await deactivateAccount();
        router.push("/login");
      } else if (confirm === "delete-step-2") {
        await deleteAccount();
        router.push("/login");
      } else if (confirm === "stop-driving") {
        await unregisterAsDriver();
        showToast("Ya no eres conductor. Sigues como pasajero.", "ok");
        setConfirm(null);
        await reload();
      }
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "No se pudo completar la acción");
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  const name = user?.name ?? sessionUser?.name ?? "Usuario";
  const email = user?.email ?? sessionUser?.email ?? "";
  const photo = user?.profilePhoto ?? sessionUser?.profilePhoto ?? null;
  const rating = user?.rating ?? sessionUser?.rating ?? null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Cargando perfil…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-[var(--gopoli-text-muted,#757575)]">{error}</p>
        <Button onClick={() => void reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-28 pt-4 md:pb-10">
      {toast ? (
        <div
          role="status"
          className={[
            "mb-4 rounded-lg px-4 py-3 text-sm text-white",
            toast.tone === "ok" ? "bg-[var(--gopoli-primary,#1B5E20)]" : "bg-red-700",
          ].join(" ")}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="mb-2 flex justify-end md:hidden">
        <Link
          href="/profile/edit"
          className="rounded-md p-2 text-[var(--gopoli-primary,#1B5E20)] hover:bg-[var(--gopoli-primary,#1B5E20)]/8"
          aria-label="Editar perfil"
        >
          ✎
        </Link>
      </div>

      <div className="flex flex-col items-center text-center">
        <ProfileAvatar photoBase64={photo} radius={50} />
        <h1 className="mt-3 text-xl font-bold">{name}</h1>
        <p className="mt-1 text-sm text-[var(--gopoli-secondary,#2E7D32)]">{email.length === 0 ? "Sin correo" : email}</p>
        {user?.phone ? <p className="mt-1 text-sm text-[var(--gopoli-text-muted,#757575)]">{user.phone}</p> : null}
        <div className="mt-3">
          <RatingBadge rating={rating} />
        </div>
        <span className="mt-2 rounded-full bg-[#F5F5F5] px-3 py-1 text-xs font-semibold text-[var(--gopoli-text-muted,#757575)]">
          Rol: {user ? userTypeLabel(user) : sessionUser?.isDriver ? "Conductor" : "Pasajero"}
        </span>
        {user?.vehicle ? (
          <p className="mt-2 text-xs text-[var(--gopoli-text-muted,#757575)]">
            {user.vehicle.brand} {user.vehicle.model} · {user.vehicle.color} · {user.vehicle.plate}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {!isDriver ? (
          <Link
            href="/profile/driver"
            className="flex items-center gap-3 rounded-xl bg-[#E8F5E9] px-4 py-4 text-[var(--gopoli-primary,#1B5E20)] transition hover:bg-[#C8E6C9]"
          >
            <svg viewBox="0 0 24 24" className="size-6 shrink-0 fill-current" aria-hidden>
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
            <span className="flex-1 text-left font-semibold">¿Quieres ser parte nuestra?</span>
            <span aria-hidden className="text-lg font-light">
              ›
            </span>
          </Link>
        ) : (
          <Button fullWidth className="!bg-[#5D4037] hover:!bg-[#4E342E]" onClick={() => setConfirm("stop-driving")}>
            Dejar la Chamba
          </Button>
        )}

        <Link href="/profile/history" className="block">
          <Button fullWidth className="!bg-[#1565C0] hover:!bg-[#0D47A1]">
            Historial de viajes
          </Button>
        </Link>

        <Link href="/profile/edit" className="block">
          <Button fullWidth>Editar perfil</Button>
        </Link>

        <Button
          fullWidth
          className="!bg-[var(--gopoli-accent,#FFC107)] !text-[#212121] hover:!bg-[#FFB300]"
          onClick={logout}
        >
          Cerrar sesión
        </Button>

        <Button fullWidth className="!bg-orange-500 hover:!bg-orange-600" onClick={() => setConfirm("deactivate")}>
          Inhabilitar cuenta
        </Button>

        <Button fullWidth variant="danger" onClick={() => setConfirm("delete-step-1")}>
          Eliminar cuenta
        </Button>
      </div>

      <ConfirmModal
        open={confirm === "deactivate"}
        onClose={() => !busy && setConfirm(null)}
        title="Inhabilitar cuenta"
        message="Tu cuenta quedará desactivada y no podrás iniciar sesión. ¿Deseas continuar?"
        confirmLabel={busy ? "…" : "Inhabilitar"}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={() => void confirmAction()}
      />

      <ConfirmModal
        open={confirm === "delete-step-1"}
        onClose={() => !busy && setConfirm(null)}
        title="Eliminar cuenta"
        message="Esta acción es permanente. Se borrarán tus datos y no podrás recuperarlos."
        confirmLabel="Continuar"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={() => void confirmAction()}
      />

      <ConfirmModal
        open={confirm === "delete-step-2"}
        onClose={() => !busy && setConfirm(null)}
        title="¿Estás seguro?"
        message="Confirma que deseas eliminar tu cuenta de forma definitiva."
        confirmLabel={busy ? "…" : "Sí, eliminar"}
        cancelLabel="No"
        confirmVariant="danger"
        onConfirm={() => void confirmAction()}
      />

      <ConfirmModal
        open={confirm === "stop-driving"}
        onClose={() => !busy && setConfirm(null)}
        title="Dejar la Chamba"
        message="Dejarás de ser conductor y volverás a usuario pasajero. Tu vehículo registrado se eliminará."
        confirmLabel={busy ? "…" : "Confirmar"}
        cancelLabel="Cancelar"
        onConfirm={() => void confirmAction()}
      />
    </div>
  );
}
