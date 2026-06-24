import type { ComponentType } from "react";
import { palette } from "../theme/colors";
import { ImpostorIcon } from "../assets/icons/ImpostorIcon";
import { WavelengthIcon } from "../assets/icons/WavelengthIcon";
import { TabooIcon } from "../assets/icons/TabooIcon";

export interface GameTheme {
  accent: string;
  accentDark: string;
  accentLight: string;
  accentMuted: string;
  text: string;
  textMuted: string;
}

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  /** Emoji fallback (used for intro overlay and non-SVG contexts) */
  icon: string;
  /** SVG icon component — preferred over emoji for card display */
  IconComponent: ComponentType<{ size?: number }>;
  accentColor: string;
  theme: GameTheme;
  /** Expo Router href — e.g. /games/impostor */
  route: string;
  status: "available" | "coming-soon";
}

// To add a new game:
//   1. Add an entry here
//   2. Create src/games/<id>/ for logic + types + words
//   3. Create app/games/<id>/ for screens
// The hub renders this array automatically — no other core files need touching.
export const GAMES: GameDefinition[] = [
  {
    id: "impostor",
    title: "Impostor",
    description: "One player has no word. Can they bluff their way through?",
    icon: "🕵️",
    IconComponent: ImpostorIcon,
    accentColor: palette.impostor,
    theme: {
      accent: "#FF2D78",
      accentDark: "#1a0010",
      accentLight: "#FF6FA3",
      accentMuted: "#4a0020",
      text: "#FFFFFF",
      textMuted: "#FFB3CC",
    },
    route: "/games/impostor",
    status: "available",
  },
  {
    id: "wavelength",
    title: "Wavelength",
    description: "Everyone gets a number. Each player picks something from their category that matches it. Can the Guesser figure out the number?",
    icon: "📡",
    IconComponent: WavelengthIcon,
    accentColor: palette.wavelength,
    theme: {
      accent: "#4FC3F7",
      accentDark: "#001a2a",
      accentLight: "#87D8FA",
      accentMuted: "#003a55",
      text: "#FFFFFF",
      textMuted: "#A8DCEF",
    },
    route: "/games/wavelength",
    status: "available",
  },
  {
    id: "taboo",
    title: "Taboo",
    description: "Describe the word without saying the forbidden ones.",
    icon: "🚫",
    IconComponent: TabooIcon,
    accentColor: palette.taboo,
    theme: {
      accent: "#69F0AE",
      accentDark: "#001a0e",
      accentLight: "#9EFFC8",
      accentMuted: "#003320",
      text: "#111111",
      textMuted: "#1a4a30",
    },
    route: "/games/taboo",
    status: "available",
  },
];

export function getGameTheme(id: string): GameTheme {
  const game = GAMES.find((g) => g.id === id);
  return game?.theme ?? { accent: "#FF2D78", accentDark: "#1a0010", accentLight: "#FF6FA3", accentMuted: "#4a0020", text: "#FFFFFF", textMuted: "#FFB3CC" };
}
