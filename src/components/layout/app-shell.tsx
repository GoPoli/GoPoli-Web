"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { GoPoliBrand } from "@/components/brand/GoPoliLogo";
import {
  IconAgenda,
  IconChat,
  IconLogin,
  IconMap,
  IconPerson,
  IconRoute,
  IconSearch,
} from "@/components/ui/icons";
import { useAuth } from "@/features/auth/auth-context";

export type AppShellNavItem = {
  href: "/mapa" | "/buscar" | "/viajes" | "/mensajes" | "/agenda" | "/perfil";
  label: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
};

export const APP_SHELL_NAV: readonly AppShellNavItem[] = [
  {
    href: "/mapa",
    label: "Inicio",
    title: "Inicio",
    icon: IconMap,
  },
  {
    href: "/buscar",
    label: "Buscar",
    title: "Buscar",
    icon: IconSearch,
  },
  {
    href: "/viajes",
    label: "Viajes",
    title: "Viajes",
    icon: IconRoute,
  },
  {
    href: "/mensajes",
    label: "Mensajes",
    title: "Mensajes",
    icon: IconChat,
  },
  {
    href: "/agenda",
    label: "Agenda",
    title: "Agenda",
    icon: IconAgenda,
  },
  {
    href: "/perfil",
    label: "Perfil",
    title: "Perfil",
    icon: IconPerson,
  },
] as const;

export type AppShellProps = {
  children: ReactNode;
  /**
   * Si se omite, usa la sesión en memoria (`useAuth`).
   * Se puede forzar para pruebas.
   */
  isAuthenticated?: boolean;
};

function navIsActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentTitle(pathname: string): string {
  const match = APP_SHELL_NAV.find((item) => navIsActive(pathname, item.href));
  return match?.title ?? "GoPoli";
}

export function AppShell({
  children,
  isAuthenticated: isAuthenticatedProp,
}: AppShellProps) {
  const pathname = usePathname() ?? "";
  const esMapa = pathname === "/mapa";
  const title = currentTitle(pathname);
  const { isAuthenticated: sessionAuth } = useAuth();
  const isAuthenticated = isAuthenticatedProp ?? sessionAuth;

  return (
    <div
      className={[
        "flex bg-[var(--gopoli-paper,#F7FBF8)] text-[var(--foreground,#122018)]",
        esMapa ? "h-dvh overflow-hidden" : "min-h-dvh",
      ].join(" ")}
    >
      <aside
        className="hidden w-56 shrink-0 flex-col border-r border-[var(--gopoli-border,#C9D7CC)] bg-white md:flex"
        aria-label="Navegación principal"
      >
        <div className="border-b border-[var(--gopoli-mist,#E7F2EA)] px-4 py-5">
          <Link
            href="/mapa"
            className="inline-flex rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)] focus-visible:ring-offset-2"
          >
            <GoPoliBrand markClassName="size-8" wordmarkClassName="text-2xl" />
          </Link>
          <p className="mt-2 text-xs leading-relaxed text-[var(--gopoli-text-muted)]">
            Cupo compartido en el Poli
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2.5">
          {APP_SHELL_NAV.map((item) => {
            const active = navIsActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)] focus-visible:ring-offset-2",
                  active
                    ? "bg-[var(--gopoli-pine)] text-white"
                    : "text-[var(--gopoli-text-muted)] hover:bg-[var(--gopoli-mist)] hover:text-[var(--gopoli-pine)]",
                ].join(" ")}
              >
                <Icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--gopoli-mist)] p-2.5">
          {isAuthenticated ? (
            <Link
              href="/perfil"
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--gopoli-text-muted)] hover:bg-[var(--gopoli-mist)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)] focus-visible:ring-offset-2"
            >
              <IconPerson className="size-5" />
              Mi cuenta
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--gopoli-primary)] hover:bg-[var(--gopoli-mist)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)] focus-visible:ring-offset-2"
            >
              <IconLogin className="size-5" />
              Iniciar sesión
            </Link>
          )}
        </div>
      </aside>

      <div
        className={[
          "flex min-w-0 flex-1 flex-col",
          esMapa ? "h-full min-h-0" : "",
        ].join(" ")}
      >
        <header
          className={[
            "sticky top-0 z-30 flex min-h-14 shrink-0 items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] text-white md:min-h-14 md:px-5",
            esMapa
              ? "bg-[var(--gopoli-pine)]/92 backdrop-blur-sm"
              : "bg-[var(--gopoli-pine)]",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/mapa"
              className="inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gopoli-pine)] md:hidden"
              aria-label="GoPoli inicio"
            >
              <GoPoliBrand
                tone="inverse"
                markClassName="size-7"
                wordmarkClassName="text-lg"
              />
            </Link>
            {!esMapa ? (
              <h1 className="truncate text-base font-semibold md:text-lg">
                {title}
              </h1>
            ) : (
              <h1 className="sr-only">{title}</h1>
            )}
            {esMapa ? (
              <p className="hidden truncate text-sm text-white/80 md:block">
                Mapa
              </p>
            ) : null}
          </div>
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-white/95 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gopoli-pine)] md:hidden"
            >
              <IconLogin className="size-4" />
              <span>Entrar</span>
            </Link>
          ) : null}
        </header>

        <main
          id="contenido-principal"
          className={
            esMapa
              ? "flex min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden p-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0"
              : "mx-auto w-full max-w-5xl flex-1 px-4 py-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-6 md:pb-6"
          }
        >
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--gopoli-mist)] bg-[var(--gopoli-paper)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
          aria-label="Navegación principal"
        >
          <ul className="flex">
            {APP_SHELL_NAV.map((item) => {
              const active = navIsActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href} className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex min-h-12 w-full flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-xs font-medium leading-tight",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gopoli-primary)]",
                      active
                        ? "text-[var(--gopoli-pine)]"
                        : "text-[var(--gopoli-text-muted)]",
                    ].join(" ")}
                  >
                    <Icon className="size-6" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
