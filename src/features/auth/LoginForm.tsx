"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GoPoliBrand } from "@/components/brand/GoPoliLogo";
import { Button, TextField } from "@/components/ui";
import { ApiException } from "@/services/api/client";
import { useAuth } from "./auth-context";

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

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    try {
      await login({ correo, contrasena });
      router.replace("/mapa");
    } catch (err) {
      if (err instanceof ApiException) {
        setMensaje(err.message);
      } else {
        setMensaje("Error de conexión con el servidor");
      }
    } finally {
      setCargando(false);
    }
  }

  const mensajeEsExito = mensaje.startsWith("Bienvenido");

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full min-w-0 max-w-md flex-col items-stretch px-5 py-8 text-center sm:px-7"
      noValidate
    >
      <div className="mt-4 flex justify-center">
        <GoPoliBrand markClassName="size-10" wordmarkClassName="text-[2.4rem]" />
      </div>

      <h1 className="sr-only">GoPoli</h1>

      <h2 className="mt-6 text-[22px] font-semibold text-[var(--gopoli-pine)]">
        Entra a tu cuenta
      </h2>

      <p className="mt-2 text-center text-sm leading-relaxed text-[var(--gopoli-text-muted,#757575)]">
        Introduce tu correo electrónico y contraseña para iniciar sesión
      </p>

      <div className="mt-9 flex w-full flex-col gap-4">
        <TextField
          type="email"
          name="correo"
          autoComplete="email"
          inputMode="email"
          placeholder="email@elpoli.edu.co"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          disabled={cargando}
          required
          aria-label="Correo electrónico"
        />

        <TextField
          type={verContrasena ? "text" : "password"}
          name="contrasena"
          autoComplete="current-password"
          placeholder="Password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          disabled={cargando}
          required
          aria-label="Contraseña"
          suffixIcon={
            <button
              type="button"
              onClick={() => setVerContrasena((v) => !v)}
              className="rounded p-1 text-[var(--gopoli-text-muted,#757575)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
              aria-label={
                verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              <EyeIcon open={verContrasena} />
            </button>
          }
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={cargando}
        className="mt-6"
      >
        Continuar
      </Button>

      {mensaje ? (
        <p
          role="alert"
          className={`mt-4 text-center text-sm ${
            mensajeEsExito
              ? "text-[var(--gopoli-secondary,#2E7D32)]"
              : "text-red-600"
          }`}
        >
          {mensaje}
        </p>
      ) : null}

      <p className="mt-4 text-center text-sm text-[var(--gopoli-text-muted,#757575)]">
        ¿No tienes una cuenta?{" "}
        <Link
          href="/registro"
          className="font-semibold text-[var(--gopoli-primary,#1B5E20)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
        >
          Crear una nueva cuenta
        </Link>
      </p>

    </form>
  );
}
