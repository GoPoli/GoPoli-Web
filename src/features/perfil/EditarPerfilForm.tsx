"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Button,
  ProfileAvatar,
  Spinner,
  TextField,
} from "@/components/ui";
import {
  mensajeCorreo,
  mensajeNombre,
  mensajeTelefono,
} from "@/features/auth/validations";
import { getSessionUser } from "@/features/auth/session";
import {
  actualizarPerfil,
  obtenerPerfil,
  subirFotoPerfil,
} from "./api";
import { ApiException } from "./errors";
import type { UsuarioPerfil } from "./types";

const MAX_FOTO_CHARS = 2_000_000;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer la imagen"));
        return;
      }
      const raw = result.includes(",") ? result.split(",").pop()! : result;
      resolve(raw);
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

export function EditarPerfilForm() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [tel, setTel] = useState("");
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    tone: "ok" | "err";
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    nombre?: string;
    correo?: string;
    tel?: string;
  }>({});

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const u = await obtenerPerfil();
      setUsuario(u);
      setNombre(u.nombre);
      setCorreo(u.correo);
      setTel(u.tel ?? "");
      setFotoBase64(u.fotoPerfil ?? null);
    } catch (e) {
      const fallback = getSessionUser();
      if (fallback) {
        setNombre(fallback.nombre);
        setCorreo(fallback.correo);
        setTel(fallback.tel ?? "");
        setFotoBase64(fallback.fotoPerfil ?? null);
        setUsuario({
          ...fallback,
          vehiculo: null,
        });
      } else {
        setErrorCarga(
          e instanceof ApiException
            ? e.message
            : "No se pudo cargar el perfil",
        );
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function onElegirFoto(file: File | null) {
    if (!file) return;
    setSubiendoFoto(true);
    try {
      const b64 = await fileToBase64(file);
      if (b64.length > MAX_FOTO_CHARS) {
        setToast({
          msg: "La imagen es demasiado grande",
          tone: "err",
        });
        return;
      }
      const actualizado = await subirFotoPerfil(b64);
      setFotoBase64(actualizado.fotoPerfil ?? b64);
      setUsuario(actualizado);
      setToast({ msg: "Foto actualizada", tone: "ok" });
    } catch (e) {
      setToast({
        msg:
          e instanceof ApiException
            ? e.message
            : "No se pudo subir la foto",
        tone: "err",
      });
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = {
      nombre: mensajeNombre(nombre) ?? undefined,
      correo: mensajeCorreo(correo) ?? undefined,
      tel: mensajeTelefono(tel) ?? undefined,
    };
    setFieldErrors(errors);
    if (errors.nombre || errors.correo || errors.tel) return;

    setGuardando(true);
    try {
      await actualizarPerfil({ nombre, correo, tel });
      router.push("/perfil");
      router.refresh();
    } catch (err) {
      setToast({
        msg:
          err instanceof ApiException ? err.message : "Error al guardar",
        tone: "err",
      });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Cargando…" />
      </div>
    );
  }

  if (errorCarga && !usuario) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-[var(--gopoli-text-muted,#757575)]">{errorCarga}</p>
        <Button onClick={() => void cargar()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto w-full max-w-lg space-y-5 px-4 pb-28 pt-4 md:pb-10"
    >
      {toast ? (
        <div
          role="status"
          className={[
            "rounded-lg px-4 py-3 text-sm text-white",
            toast.tone === "ok"
              ? "bg-[var(--gopoli-secondary,#2E7D32)]"
              : "bg-red-700",
          ].join(" ")}
        >
          {toast.msg}
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <ProfileAvatar
            fotoBase64={fotoBase64}
            radius={56}
            onClick={
              subiendoFoto
                ? undefined
                : () =>
                    document.getElementById("foto-perfil-input")?.click()
            }
          />
          {subiendoFoto ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Spinner size="sm" label="Subiendo foto…" />
            </div>
          ) : null}
        </div>
        <input
          id="foto-perfil-input"
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={subiendoFoto || guardando}
          onChange={(ev) => {
            const f = ev.target.files?.[0] ?? null;
            void onElegirFoto(f);
            ev.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={subiendoFoto || guardando}
          onClick={() =>
            document.getElementById("foto-perfil-input")?.click()
          }
          className="text-sm font-medium text-[var(--gopoli-primary,#1B5E20)] disabled:opacity-50"
        >
          Cambiar foto
        </button>
      </div>

      <TextField
        label="Nombre completo"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        disabled={guardando}
        error={fieldErrors.nombre}
        autoComplete="name"
      />
      <TextField
        label="Correo"
        type="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        disabled={guardando}
        error={fieldErrors.correo}
        autoComplete="email"
      />
      <TextField
        label="Teléfono"
        type="tel"
        inputMode="numeric"
        value={tel}
        onChange={(e) => setTel(e.target.value)}
        disabled={guardando}
        error={fieldErrors.tel}
        autoComplete="tel"
      />

      <Button type="submit" fullWidth size="lg" loading={guardando}>
        Guardar cambios
      </Button>
    </form>
  );
}
