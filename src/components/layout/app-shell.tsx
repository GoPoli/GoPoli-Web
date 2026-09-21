"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
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
        "flex bg-[var(--background,#ffffff)] text-[var(--foreground,#171717)]",
        esMapa ? "h-dvh overflow-hidden" : "min-h-dvh",
      ].join(" ")}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden w-60 shrink-0 flex-col border-r border-[var(--gopoli-border,#E0E0E0)] bg-white md:flex"
        aria-label="Navegación principal"
      >
        <div className="border-b border-[var(--gopoli-border,#E0E0E0)] px-5 py-5">
          <Link
            href="/mapa"
            className="text-xl font-bold tracking-tight text-[var(--gopoli-primary,#1B5E20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)] focus-visible:ring-offset-2 rounded"
          >
            GoPoli
          </Link>
          <p className="mt-1 text-xs text-[var(--gopoli-text-muted,#757575)]">
            Viaje compartido
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {APP_SHELL_NAV.map((item) => {
            const active = navIsActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)] focus-visible:ring-offset-2",
                  active
                    ? "bg-[var(--gopoli-primary,#1B5E20)]/10 text-[var(--gopoli-primary,#1B5E20)]"
                    : "text-[var(--gopoli-text-muted,#757575)] hover:bg-black/5 hover:text-[var(--gopoli-primary,#1B5E20)]",
                ].join(" ")}
              >
                <Icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--gopoli-border,#E0E0E0)] p-3">
          {isAuthenticated ? (
            <Link
              href="/perfil"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--gopoli-text-muted,#757575)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)] focus-visible:ring-offset-2"
            >
              <IconPerson className="size-5" />
              Mi cuenta
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--gopoli-primary,#1B5E20)] hover:bg-[var(--gopoli-primary,#1B5E20)]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)] focus-visible:ring-offset-2"
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
        {/* Top bar (AppBar-style) */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 bg-[var(--gopoli-primary,#1B5E20)] px-4 text-white shadow-sm md:h-16 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/mapa"
              className="truncate text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gopoli-primary,#1B5E20)] rounded md:hidden"
            >
              GoPoli
            </Link>
            <h1 className="truncate text-base font-semibold md:text-lg">
              {title}
            </h1>
          </div>
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-white/95 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gopoli-primary,#1B5E20)] md:hidden"
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

        {/* Mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--gopoli-border,#E0E0E0)] bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
          aria-label="Navegación principal"
        >
          <ul className="flex overflow-x-auto">
            {APP_SHELL_NAV.map((item) => {
              const active = navIsActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href} className="min-w-[4.5rem] flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gopoli-primary,#1B5E20)]",
                      active
                        ? "text-[var(--gopoli-primary,#1B5E20)]"
                        : "text-[var(--gopoli-text-muted,#757575)]",
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
