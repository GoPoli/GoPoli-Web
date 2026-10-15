export type ShellSection = { href: string; title: string };

/** Una ruta pertenece a la sección si es su raíz o una de sus subrutas. */
export function isWithin(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Título de la barra superior; null cuando la ruta no pertenece a ninguna sección. */
export function shellTitle(
  pathname: string,
  sections: readonly ShellSection[],
): string | null {
  return sections.find((section) => isWithin(pathname, section.href))?.title ?? null;
}
