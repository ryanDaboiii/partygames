import { getGameTheme, type GameTheme } from "../games/registry";

export function useGameTheme(gameId: string): GameTheme {
  return getGameTheme(gameId);
}
