export const palette = {
  // Backgrounds
  bg: "#0D0D1A",
  bgCard: "#1A1A2E",
  bgCardElevated: "#252540",

  // Neutrals
  white: "#FFFFFF",
  offWhite: "#E8E8F0",
  muted: "#9898B0",
  border: "#2E2E4A",

  // Impostor accent — electric red/orange
  impostor: "#FF4E4E",
  impostorDim: "#FF4E4E33",

  // Wavelength accent (coming soon)
  wavelength: "#6C63FF",
  wavelengthDim: "#6C63FF33",

  // Taboo accent (coming soon)
  taboo: "#00C9A7",
  tabooDim: "#00C9A733",

  // Utility
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  transparent: "transparent",
} as const;

export type PaletteKey = keyof typeof palette;
