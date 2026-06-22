import type { Category } from "./categories";

export interface Player {
  id: string;
  name: string;
}

export interface PlayerCategory {
  player: Player;
  category: Category;
}

export interface CurrentRound {
  guesserIndex: number;
  secretNumber: number;
  playerCategories: PlayerCategory[];
  categorySwitches: Record<string, number>; // keyed by player.id, counts switches used this round
}

export interface RoundResult {
  roundNumber: number;
  guesserPlayerId: string;
  secretNumber: number;
  correct: boolean;
  guesserScore: number;
  nonGuesserBonus: number;
}

export interface WavelengthSetup {
  players: Player[];
  maxNumber: number;
  totalRounds: number;
}

export type GamePhase = "setup" | "playing" | "game-over";
