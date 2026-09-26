"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GoPoliBrand } from "@/components/brand/GoPoliLogo";
import { Button, TextField } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "./auth-context";
import { EyeIcon } from "./EyeIcon";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await login({ email, password });
      router.replace("/map");
    } catch (err) {
      if (err instanceof ApiError) {
        setMessage(err.message);
      } else {
        setMessage("Error de conexión con el servidor");
      }
    } finally {
      setLoading(false);
    }
  }

  const isSuccess = message.startsWith("Bienvenido");

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
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="email@elpoli.edu.co"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          aria-label="Correo electrónico"
        />

        <TextField
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          aria-label="Contraseña"
          suffixIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="rounded p-1 text-[var(--gopoli-text-muted,#757575)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              <EyeIcon open={showPassword} />
            </button>
          }
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        className="mt-6"
      >
        Continuar
      </Button>

      {message ? (
        <p
          role="alert"
          className={`mt-4 text-center text-sm ${
            isSuccess
              ? "text-[var(--gopoli-secondary,#2E7D32)]"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      ) : null}

      <p className="mt-4 text-center text-sm text-[var(--gopoli-text-muted,#757575)]">
        ¿No tienes una cuenta?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[var(--gopoli-primary,#1B5E20)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
        >
          Crear una nueva cuenta
        </Link>
      </p>

    </form>
  );
}
