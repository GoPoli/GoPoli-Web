"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { GoPoliBrand } from "@/components/brand/GoPoliLogo";
import { Button, Modal, Spinner, TextField } from "@/components/ui";
import { ApiException } from "@/services/api/client";
import { useAuth } from "./auth-context";
import type { Carrera } from "./types";
import {
  mensajeConfirmacion,
  mensajeContrasena,
  mensajeCorreo,
  mensajeNombre,
  mensajeTelefono,
} from "./validations";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-5"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-5"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

type FieldErrors = {
  correo?: string;
  contrasena?: string;
  confirmacion?: string;
  nombre?: string;
  telefono?: string;
  carrera?: string;
};

export function RegistroForm() {
  const { register, fetchCarreras } = useAuth();
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [carreraId, setCarreraId] = useState<number | "">("");

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [cargandoCarreras, setCargandoCarreras] = useState(true);
  const [errorCarreras, setErrorCarreras] = useState<string | null>(null);

  const [verContrasena, setVerContrasena] = useState(false);
  const [verConfirmacion, setVerConfirmacion] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [mensajeGlobal, setMensajeGlobal] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [exitoAbierto, setExitoAbierto] = useState(false);

  const cargarCarreras = useCallback(async () => {
    setCargandoCarreras(true);
    setErrorCarreras(null);
    try {
      const lista = await fetchCarreras();
      setCarreras(lista);
    } catch (err) {
      if (err instanceof ApiException) {
        setErrorCarreras(err.message);
      } else {
        setErrorCarreras("No se pudieron cargar las carreras");
      }
    } finally {
      setCargandoCarreras(false);
    }
  }, [fetchCarreras]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const lista = await fetchCarreras();
        if (cancelled) return;
        setCarreras(lista);
        setErrorCarreras(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiException) {
          setErrorCarreras(err.message);
        } else {
          setErrorCarreras("No se pudieron cargar las carreras");
        }
      } finally {
        if (!cancelled) setCargandoCarreras(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchCarreras]);

  function validar(): boolean {
    const errors: FieldErrors = {
      correo: mensajeCorreo(correo) ?? undefined,
      contrasena: mensajeContrasena(contrasena) ?? undefined,
      confirmacion:
        mensajeConfirmacion(contrasena, confirmacion) ?? undefined,
      nombre: mensajeNombre(nombre) ?? undefined,
      telefono: mensajeTelefono(telefono) ?? undefined,
      carrera:
        carreraId === "" ? "Selecciona tu carrera" : undefined,
    };
    setFieldErrors(errors);
    if (carreraId === "") {
      setMensajeGlobal("Selecciona tu carrera");
    }
    return !Object.values(errors).some(Boolean);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensajeGlobal(null);

    if (carreraId === "") {
      setMensajeGlobal("Selecciona tu carrera");
      setFieldErrors((prev) => ({
        ...prev,
        carrera: "Selecciona tu carrera",
      }));
      return;
    }

    if (!validar()) return;

    setRegistrando(true);
    try {
      await register({
        correo,
        contrasena,
        nombre,
        tel: telefono,
        idCarrera: carreraId,
      });
      setExitoAbierto(true);
    } catch (err) {
      const msg =
        err instanceof ApiException
          ? err.message
          : "Error de conexión con el servidor";
      setMensajeGlobal(msg);
    } finally {
      setRegistrando(false);
    }
  }

  function irALogin() {
    setExitoAbierto(false);
    router.replace("/login");
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full min-w-0 max-w-md flex-col px-5 py-6 sm:px-7"
        noValidate
      >
        <div className="flex justify-center">
          <GoPoliBrand markClassName="size-10" wordmarkClassName="text-4xl" />
        </div>
        <h1 className="sr-only">GoPoli</h1>
        <h2 className="mt-2 text-center text-xl font-semibold text-[var(--gopoli-primary,#1B5E20)]">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-[var(--gopoli-text-muted,#757575)]">
          Completa tus datos con correo institucional @elpoli.edu.co
        </p>

        <div className="mt-7 flex flex-col gap-4">
          <TextField
            label="Correo electrónico"
            type="email"
            name="correo"
            autoComplete="email"
            placeholder="nombre@elpoli.edu.co"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={registrando}
            error={fieldErrors.correo}
            required
          />

          <TextField
            label="Contraseña"
            type={verContrasena ? "text" : "password"}
            name="contrasena"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            disabled={registrando}
            error={fieldErrors.contrasena}
            required
            suffixIcon={
              <button
                type="button"
                onClick={() => setVerContrasena((v) => !v)}
                className="rounded p-1 text-[var(--gopoli-text-muted,#757575)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
                aria-label={
                  verContrasena
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                <EyeIcon open={verContrasena} />
              </button>
            }
          />

          <TextField
            label="Confirmar contraseña"
            type={verConfirmacion ? "text" : "password"}
            name="confirmacion"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            disabled={registrando}
            error={fieldErrors.confirmacion}
            required
            suffixIcon={
              <button
                type="button"
                onClick={() => setVerConfirmacion((v) => !v)}
                className="rounded p-1 text-[var(--gopoli-text-muted,#757575)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
                aria-label={
                  verConfirmacion
                    ? "Ocultar confirmación"
                    : "Mostrar confirmación"
                }
              >
                <EyeIcon open={verConfirmacion} />
              </button>
            }
          />

          <TextField
            label="Nombre completo"
            type="text"
            name="nombre"
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={registrando}
            error={fieldErrors.nombre}
            required
          />

          <div className="w-full">
            <label
              htmlFor="carrera"
              className="mb-1.5 block text-sm font-medium text-[var(--gopoli-text-muted,#757575)]"
            >
              Carrera
            </label>
            {cargandoCarreras ? (
              <div className="flex justify-center py-3">
                <Spinner label="Cargando carreras…" />
              </div>
            ) : errorCarreras ? (
              <div className="flex flex-col gap-2">
                <p role="alert" className="text-sm text-red-600">
                  {errorCarreras}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void cargarCarreras()}
                >
                  Reintentar
                </Button>
              </div>
            ) : carreras.length === 0 ? (
              <p className="text-sm text-[var(--gopoli-text-muted,#757575)]">
                No hay carreras disponibles.
              </p>
            ) : (
              <select
                id="carrera"
                name="carrera"
                value={carreraId === "" ? "" : String(carreraId)}
                disabled={registrando}
                onChange={(e) => {
                  const v = e.target.value;
                  setCarreraId(v === "" ? "" : Number.parseInt(v, 10));
                  setMensajeGlobal(null);
                }}
                aria-invalid={fieldErrors.carrera ? true : undefined}
                className={[
                  "w-full rounded-[10px] border bg-white px-4 py-3 text-[15px]",
                  "text-[var(--foreground,#171717)]",
                  "focus:outline-none focus:border-2 focus:border-[var(--gopoli-primary,#1B5E20)]",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  fieldErrors.carrera
                    ? "border-red-500"
                    : "border-[var(--gopoli-border,#E0E0E0)]",
                ].join(" ")}
              >
                <option value="">Selecciona tu carrera</option>
                {carreras.map((c) => (
                  <option key={c.idCarrera} value={c.idCarrera}>
                    {c.nombreCarrera}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.carrera ? (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {fieldErrors.carrera}
              </p>
            ) : null}
          </div>

          <TextField
            label="Teléfono"
            type="tel"
            name="telefono"
            autoComplete="tel"
            inputMode="numeric"
            placeholder="3001234567"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={registrando}
            error={fieldErrors.telefono}
            required
          />
        </div>

        {mensajeGlobal ? (
          <p role="alert" className="mt-4 text-center text-sm text-red-600">
            {mensajeGlobal}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={registrando}
          className="mt-6"
        >
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
        open={exitoAbierto}
        onClose={irALogin}
        closeOnBackdrop={false}
        title="Cuenta creada"
        footer={
          <Button type="button" variant="primary" onClick={irALogin}>
            Iniciar sesión
          </Button>
        }
      >
        <p>
          Tu cuenta fue registrada correctamente. Ya puedes iniciar sesión.
        </p>
      </Modal>
    </>
  );
}
