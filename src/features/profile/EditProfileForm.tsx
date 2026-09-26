"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, ProfileAvatar, Spinner, TextField } from "@/components/ui";
import { useAuth } from "@/features/auth/auth-context";
import { getSessionUser } from "@/features/auth/session";
import type { User } from "@/features/auth/types";
import { emailError, nameError, phoneError } from "@/features/auth/validations";
import type { Program } from "@/features/catalog/types";
import { ApiError } from "@/lib/api/client";
import { fetchProfile, updateProfile, uploadProfilePhoto } from "./api";

const MAX_PHOTO_CHARS = 2_000_000;
const PHOTO_INPUT_ID = "profile-photo-input";
const SELECT_PROGRAM = "Selecciona tu carrera";

type Toast = { message: string; tone: "ok" | "err" };

type FieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  program?: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer la imagen"));
        return;
      }
      resolve(result.includes(",") ? result.split(",").pop()! : result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

export function EditProfileForm() {
  const router = useRouter();
  const { fetchPrograms } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [programId, setProgramId] = useState<number | "">("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const fillForm = useCallback((source: User) => {
    setUser(source);
    setName(source.name);
    setEmail(source.email);
    setPhone(source.phone ?? "");
    setProgramId(source.programId ?? "");
    setPhotoBase64(source.profilePhoto ?? null);
  }, []);

  const query = useCallback(
    () =>
      Promise.all([fetchProfile(), fetchPrograms()])
        .then(([profile, programList]) => {
          setPrograms(programList);
          fillForm(profile);
        })
        .catch((e: unknown) => {
          const fallback = getSessionUser();
          if (fallback) {
            fillForm(fallback);
          } else {
            setLoadError(e instanceof ApiError ? e.message : "No se pudo cargar el perfil");
          }
        })
        .finally(() => setLoading(false)),
    [fetchPrograms, fillForm],
  );

  const reload = useCallback(() => {
    setLoading(true);
    setLoadError(null);
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

  function openPhotoPicker() {
    document.getElementById(PHOTO_INPUT_ID)?.click();
  }

  async function onPhotoSelected(file: File | null) {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const base64 = await fileToBase64(file);
      if (base64.length > MAX_PHOTO_CHARS) {
        setToast({ message: "La imagen es demasiado grande", tone: "err" });
        return;
      }
      const updated = await uploadProfilePhoto(base64);
      setPhotoBase64(updated.profilePhoto ?? base64);
      setUser(updated);
      setToast({ message: "Foto actualizada", tone: "ok" });
    } catch (e) {
      setToast({ message: e instanceof ApiError ? e.message : "No se pudo subir la foto", tone: "err" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: FieldErrors = {
      name: nameError(name) ?? undefined,
      email: emailError(email) ?? undefined,
      phone: phoneError(phone) ?? undefined,
      program: programId === "" ? SELECT_PROGRAM : undefined,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean) || programId === "") return;

    setSaving(true);
    try {
      await updateProfile({ name, email, phone, programId });
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setToast({ message: err instanceof ApiError ? err.message : "Error al guardar", tone: "err" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Cargando…" />
      </div>
    );
  }

  if (loadError && !user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-[var(--gopoli-text-muted,#757575)]">{loadError}</p>
        <Button onClick={() => void reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto w-full max-w-lg space-y-5 px-4 pb-28 pt-4 md:pb-10">
      {toast ? (
        <div
          role="status"
          className={[
            "rounded-lg px-4 py-3 text-sm text-white",
            toast.tone === "ok" ? "bg-[var(--gopoli-secondary,#2E7D32)]" : "bg-red-700",
          ].join(" ")}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <ProfileAvatar photoBase64={photoBase64} radius={56} onClick={uploadingPhoto ? undefined : openPhotoPicker} />
          {uploadingPhoto ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Spinner size="sm" label="Subiendo foto…" />
            </div>
          ) : null}
        </div>
        <input
          id={PHOTO_INPUT_ID}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploadingPhoto || saving}
          onChange={(ev) => {
            void onPhotoSelected(ev.target.files?.[0] ?? null);
            ev.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploadingPhoto || saving}
          onClick={openPhotoPicker}
          className="text-sm font-medium text-[var(--gopoli-primary,#1B5E20)] disabled:opacity-50"
        >
          Cambiar foto
        </button>
      </div>

      <TextField
        label="Nombre completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving}
        error={fieldErrors.name}
        autoComplete="name"
      />
      <TextField
        label="Correo"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={saving}
        error={fieldErrors.email}
        autoComplete="email"
      />
      <TextField
        label="Teléfono"
        type="tel"
        inputMode="numeric"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={saving}
        error={fieldErrors.phone}
        autoComplete="tel"
      />
      <div>
        <label htmlFor="profile-program" className="mb-1.5 block text-sm font-medium text-[var(--gopoli-text-muted)]">
          Carrera
        </label>
        <select
          id="profile-program"
          value={programId}
          disabled={saving}
          onChange={(e) => setProgramId(e.target.value === "" ? "" : Number.parseInt(e.target.value, 10))}
          aria-invalid={fieldErrors.program ? true : undefined}
          aria-describedby={fieldErrors.program ? "profile-program-error" : undefined}
          className="min-h-12 w-full rounded-xl border border-[var(--gopoli-field-border)] bg-white px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)]"
        >
          <option value="">{SELECT_PROGRAM}</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
        {fieldErrors.program ? (
          <p id="profile-program-error" role="alert" className="mt-1.5 text-sm text-red-700">
            {fieldErrors.program}
          </p>
        ) : null}
      </div>

      <Button type="submit" fullWidth size="lg" loading={saving}>
        Guardar cambios
      </Button>
    </form>
  );
}
