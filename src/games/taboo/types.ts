export interface TabooCard {
  word: string;
  tabooWords: [string, string, string, string, string];
}

export interface TurnResult {
  cluegiver: string;
  correct: number;
  passed: number;
  taboos: number;
  roundNumber: number;
}

export type GamePhase = "setup" | "turn-start" | "turn-active" | "turn-recap" | "game-over";

export interface TabooSetup {
  players: string[];
  roundTimeSecs: number;
  totalRounds: number;
  scoringMode: "conventional" | "extended";
}
