// Nombres de las variables CSS del tema (definidas en globals.css).
export const themeTokens = {
  primary: "--gopoli-primary",
  secondary: "--gopoli-secondary",
  accent: "--gopoli-accent",
  textMuted: "--gopoli-text-muted",
  fieldBorder: "--gopoli-field-border",
} as const;

export const themeColors = {
  primary: "#143528",
  secondary: "#1B5E20",
  accent: "#E6A317",
  textMuted: "#4E6156",
  fieldBorder: "#C9D7CC",
} as const;

export type ThemeTokenName = (typeof themeTokens)[keyof typeof themeTokens];
