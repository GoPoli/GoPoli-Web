"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { GoPoliBrand } from "@/components/brand/GoPoliLogo";
import { Button, Modal, Spinner, TextField } from "@/components/ui";
import type { Program } from "@/features/catalog/types";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "./auth-context";
import { EyeIcon } from "./EyeIcon";
import { confirmationError, emailError, nameError, passwordError, phoneError } from "./validations";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmation?: string;
  name?: string;
  phone?: string;
  program?: string;
};

const SELECT_PROGRAM = "Selecciona tu carrera";

function programsErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "No se pudieron cargar las carreras";
}

export function SignupForm() {
  const { register, fetchPrograms } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [programId, setProgramId] = useState<number | "">("");

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [programsError, setProgramsError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successOpen, setSuccessOpen] = useState(false);

  const reloadPrograms = useCallback(() => {
    setLoadingPrograms(true);
    setProgramsError(null);
    return fetchPrograms()
      .then(setPrograms)
      .catch((err: unknown) => setProgramsError(programsErrorMessage(err)))
      .finally(() => setLoadingPrograms(false));
  }, [fetchPrograms]);

  useEffect(() => {
    let cancelled = false;
    fetchPrograms()
      .then((list) => {
        if (!cancelled) setPrograms(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setProgramsError(programsErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingPrograms(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPrograms]);

  function validate(): boolean {
    const errors: FieldErrors = {
      email: emailError(email) ?? undefined,
      password: passwordError(password) ?? undefined,
      confirmation: confirmationError(password, confirmation) ?? undefined,
      name: nameError(name) ?? undefined,
      phone: phoneError(phone) ?? undefined,
      program: programId === "" ? SELECT_PROGRAM : undefined,
    };
    setFieldErrors(errors);
    if (programId === "") setGlobalMessage(SELECT_PROGRAM);
    return !Object.values(errors).some(Boolean);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalMessage(null);

    if (programId === "") {
      setGlobalMessage(SELECT_PROGRAM);
      setFieldErrors((prev) => ({ ...prev, program: SELECT_PROGRAM }));
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({ email, password, name, phone, programId });
      setSuccessOpen(true);
    } catch (err) {
      setGlobalMessage(err instanceof ApiError ? err.message : "Error de conexión con el servidor");
    } finally {
      setSubmitting(false);
    }
  }

  function goToLogin() {
    setSuccessOpen(false);
    router.replace("/login");
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mx-auto flex w-full min-w-0 max-w-md flex-col px-5 py-6 sm:px-7" noValidate>
        <div className="flex justify-center">
          <GoPoliBrand markClassName="size-10" wordmarkClassName="text-4xl" />
        </div>
        <h1 className="sr-only">GoPoli</h1>
        <h2 className="mt-2 text-center text-xl font-semibold text-[var(--gopoli-primary,#1B5E20)]">Crea tu cuenta</h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-[var(--gopoli-text-muted,#757575)]">
          Completa tus datos con correo institucional @elpoli.edu.co
        </p>

        <div className="mt-7 flex flex-col gap-4">
          <TextField
            label="Correo electrónico"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="nombre@elpoli.edu.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            error={fieldErrors.email}
            required
          />

          <TextField
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            error={fieldErrors.password}
            required
            suffixIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="rounded p-1 text-[var(--gopoli-text-muted,#757575)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <EyeIcon open={showPassword} />
              </button>
            }
          />

          <TextField
            label="Confirmar contraseña"
            type={showConfirmation ? "text" : "password"}
            name="confirmation"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={submitting}
            error={fieldErrors.confirmation}
            required
            suffixIcon={
              <button
                type="button"
                onClick={() => setShowConfirmation((v) => !v)}
                className="rounded p-1 text-[var(--gopoli-text-muted,#757575)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
                aria-label={showConfirmation ? "Ocultar confirmación" : "Mostrar confirmación"}
              >
                <EyeIcon open={showConfirmation} />
              </button>
            }
          />

          <TextField
            label="Nombre completo"
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            error={fieldErrors.name}
            required
          />

          <div className="w-full">
            <label htmlFor="program" className="mb-1.5 block text-sm font-medium text-[var(--gopoli-text-muted,#757575)]">
              Carrera
            </label>
            {loadingPrograms ? (
              <div className="flex justify-center py-3">
                <Spinner label="Cargando carreras…" />
              </div>
            ) : programsError ? (
              <div className="flex flex-col gap-2">
                <p role="alert" className="text-sm text-red-600">
                  {programsError}
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={() => void reloadPrograms()}>
                  Reintentar
                </Button>
              </div>
            ) : programs.length === 0 ? (
              <p className="text-sm text-[var(--gopoli-text-muted,#757575)]">No hay carreras disponibles.</p>
            ) : (
              <select
                id="program"
                name="program"
                value={programId === "" ? "" : String(programId)}
                disabled={submitting}
                onChange={(e) => {
                  const v = e.target.value;
                  setProgramId(v === "" ? "" : Number.parseInt(v, 10));
                  setGlobalMessage(null);
                }}
                aria-invalid={fieldErrors.program ? true : undefined}
                className={[
                  "w-full rounded-[10px] border bg-white px-4 py-3 text-[15px]",
                  "text-[var(--foreground,#171717)]",
                  "focus:outline-none focus:border-2 focus:border-[var(--gopoli-primary,#1B5E20)]",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  fieldErrors.program ? "border-red-500" : "border-[var(--gopoli-border,#E0E0E0)]",
                ].join(" ")}
              >
                <option value="">{SELECT_PROGRAM}</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.program ? (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {fieldErrors.program}
              </p>
            ) : null}
          </div>

          <TextField
            label="Teléfono"
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="numeric"
            placeholder="3001234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
            error={fieldErrors.phone}
            required
          />
        </div>

        {globalMessage ? (
          <p role="alert" className="mt-4 text-center text-sm text-red-600">
            {globalMessage}
          </p>
        ) : null}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting} className="mt-6">
          Crear cuenta
        </Button>

        <p className="mt-4 text-center text-sm text-[var(--gopoli-text-muted,#757575)]">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--gopoli-accent,#FFC107)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
          >
            Iniciar sesión
          </Link>
        </p>
      </form>

      <Modal
        open={successOpen}
        onClose={goToLogin}
        closeOnBackdrop={false}
        title="Cuenta creada"
        footer={
          <Button type="button" variant="primary" onClick={goToLogin}>
            Iniciar sesión
          </Button>
        }
      >
        <p>Tu cuenta fue registrada correctamente. Ya puedes iniciar sesión.</p>
      </Modal>
    </>
  );
}
