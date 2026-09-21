/**
 * GoPoli theme token NAMES — CSS variables defined in globals.css.
 * Values mirror frontend/lib/theme/app_colors.dart.
 *
 * Prefer Tailwind arbitrary values, e.g. bg-[var(--gopoli-primary)].
 * Do not require further tailwind.config edits for these tokens.
 */
export const themeTokens = {
  /** AppColors.verdePrimario #1B5E20 */
  primary: "--gopoli-primary",
  /** AppColors.verdeSecundario #2E7D32 */
  secondary: "--gopoli-secondary",
  /** AppColors.amarillo #FFC107 */
  accent: "--gopoli-accent",
  /** AppColors.grisTexto #757575 */
  textMuted: "--gopoli-text-muted",
  /** AppColors.bordeCampo #E0E0E0 */
  fieldBorder: "--gopoli-field-border",
} as const;

/** Hex values (same source as CSS vars) for metadata / non-CSS use. */
export const themeColors = {
  primary: "#1B5E20",
  secondary: "#2E7D32",
  accent: "#FFC107",
  textMuted: "#757575",
  fieldBorder: "#E0E0E0",
} as const;

export type ThemeTokenName = (typeof themeTokens)[keyof typeof themeTokens];
