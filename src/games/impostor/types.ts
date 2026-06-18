export type GameMode = "pass-and-play" | "online";

export interface Player {
  id: string;
  name: string;
}

export type PlayerRole = "crewmate" | "impostor";

export interface PlayerAssignment {
  player: Player;
  role: PlayerRole;
  /** undefined for impostors */
  word?: string;
}

export type ImpostorCategory =
  | "Animals"
  | "Movies & TV"
  | "Food & Drink"
  | "Sports"
  | "Famous Places"
  | "Jobs & Professions"
  | "Everyday Objects";

export interface ImpostorSetup {
  mode: GameMode;
  players: Player[];
  impostorCount: number;
  category: ImpostorCategory;
}

export interface VoteEntry {
  voterId: string;
  accusedId: string;
}

export type GamePhase =
  | "setup"
  | "mode-select"
  | "reveal"
  | "discussion"
  | "voting"
  | "results";

export interface ImpostorGameState {
  phase: GamePhase;
  setup: ImpostorSetup | null;
  assignments: PlayerAssignment[];
  revealIndex: number; // which player is currently viewing their card
  votes: VoteEntry[];
  votingIndex: number; // which player is currently voting
  secretWord: string;
}
