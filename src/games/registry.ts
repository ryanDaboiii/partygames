import { palette } from "../theme/colors";

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  /** Emoji or icon name */
  icon: string;
  accentColor: string;
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
    accentColor: palette.impostor,
    route: "/games/impostor",
    status: "available",
  },
  {
    id: "wavelength",
    title: "Wavelength",
    description: "Everyone gets a number. Each player picks something from their category that matches it. Can the Guesser figure out the number?",
    icon: "📡",
    accentColor: palette.wavelength,
    route: "/games/wavelength",
    status: "available",
  },
  {
    id: "taboo",
    title: "Taboo",
    description: "Describe the word without saying the forbidden ones.",
    icon: "🚫",
    accentColor: palette.taboo,
    route: "/games/taboo",
    status: "available",
  },
];
