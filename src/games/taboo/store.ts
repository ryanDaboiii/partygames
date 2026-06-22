import { create } from "zustand";
import type { TabooCard, TurnResult, GamePhase, TabooSetup } from "./types";
import { MAX_PASSES_PER_TURN, getFreshDeck } from "./logic";

interface TabooStore {
  phase: GamePhase;
  players: string[];
  deck: TabooCard[];
  cardIndex: number;
  roundTimeSecs: number;
  totalRounds: number;

  totalTurnsPlayed: number;
  totalTurnsMax: number;

  turnCorrect: number;
  turnPassed: number;
  turnTaboos: number;
  passesUsed: number;
  turnNetScore: number;

  gamePoints: Record<string, number>;

  turnHistory: TurnResult[];

  startGame: (setup: TabooSetup) => void;
  startTurn: () => void;
  gotIt: () => void;
  pass: () => void;
  taboo: () => void;
  endTurn: () => void;
  nextTurn: () => void;
  reset: () => void;
}

const INITIAL = {
  phase: "setup" as GamePhase,
  players: [] as string[],
  deck: [] as TabooCard[],
  cardIndex: 0,
  roundTimeSecs: 60,
  totalRounds: 1,
  totalTurnsPlayed: 0,
  totalTurnsMax: 0,
  turnCorrect: 0,
  turnPassed: 0,
  turnTaboos: 0,
  passesUsed: 0,
  turnNetScore: 0,
  gamePoints: {} as Record<string, number>,
  turnHistory: [] as TurnResult[],
};

export const useTabooStore = create<TabooStore>((set, get) => ({
  ...INITIAL,

  startGame: (setup) => {
    const deck = getFreshDeck();
    const totalTurnsMax = setup.players.length * setup.totalRounds;
    const gamePoints: Record<string, number> = {};
    for (const name of setup.players) gamePoints[name] = 0;

    set({
      ...INITIAL,
      phase: "turn-start",
      players: setup.players,
      deck,
      roundTimeSecs: setup.roundTimeSecs,
      totalRounds: setup.totalRounds,
      totalTurnsMax,
      gamePoints,
    });
  },

  startTurn: () => {
    set({
      phase: "turn-active",
      turnCorrect: 0,
      turnPassed: 0,
      turnTaboos: 0,
      passesUsed: 0,
    });
  },

  gotIt: () => {
    const { cardIndex, deck, turnCorrect } = get();
    set({
      turnCorrect: turnCorrect + 1,
      cardIndex: (cardIndex + 1) % deck.length,
    });
  },

  pass: () => {
    const { cardIndex, deck, turnPassed, passesUsed } = get();
    if (passesUsed >= MAX_PASSES_PER_TURN) return;
    set({
      turnPassed: turnPassed + 1,
      passesUsed: passesUsed + 1,
      cardIndex: (cardIndex + 1) % deck.length,
    });
  },

  taboo: () => {
    const { cardIndex, deck, turnTaboos } = get();
    set({
      turnTaboos: turnTaboos + 1,
      cardIndex: (cardIndex + 1) % deck.length,
    });
  },

  endTurn: () => {
    const { totalTurnsPlayed, players, turnCorrect, turnPassed, turnTaboos, turnHistory, gamePoints, cardIndex, deck } = get();
    if (get().phase === "turn-recap") return; // guard against double-call

    const cluegiver = players[totalTurnsPlayed % players.length];
    const roundNumber = Math.floor(totalTurnsPlayed / players.length) + 1;
    // Fix 4: passes are neutral — only taboos subtract
    const netScore = Math.max(0, turnCorrect - turnTaboos);

    set({
      // Fix 3: advance past the card that was on screen when time ran out
      cardIndex: (cardIndex + 1) % deck.length,
      turnHistory: [
        ...turnHistory,
        { cluegiver, correct: turnCorrect, passed: turnPassed, taboos: turnTaboos, roundNumber },
      ],
      gamePoints: { ...gamePoints, [cluegiver]: (gamePoints[cluegiver] ?? 0) + netScore },
      turnNetScore: netScore,
      phase: "turn-recap",
    });
  },

  nextTurn: () => {
    const { totalTurnsPlayed, totalTurnsMax } = get();
    const newTotal = totalTurnsPlayed + 1;
    set({
      totalTurnsPlayed: newTotal,
      phase: newTotal >= totalTurnsMax ? "game-over" : "turn-start",
    });
  },

  reset: () => set(INITIAL),
}));

// ── Derived selector ───────────────────────────────────────────────────────────

export function getCurrentCluegiver(players: string[], totalTurnsPlayed: number): string {
  if (players.length === 0) return "?";
  return players[totalTurnsPlayed % players.length];
}
