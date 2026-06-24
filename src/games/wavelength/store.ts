import { create } from "zustand";
import type { Player, PlayerCategory, CurrentRound, WavelengthSetup, GamePhase, RoundResult } from "./types";
import { generateSecretNumber, scoreResult } from "./logic";
import { pickCategories, CATEGORIES } from "./categories";
import { usePlayerStore } from "../../store/players";
import { useSessionStore } from "../../store/session";

const MAX_SWITCHES_PER_ROUND = 3;

interface WavelengthStore {
  phase: GamePhase;
  players: Player[];
  maxNumber: number;
  totalRounds: number;
  totalTurns: number; // totalRounds * players.length — actual turn count for game-over
  roundNumber: number;
  currentRound: CurrentRound | null;
  history: RoundResult[];
  categoryStyle: "specific" | "simple";
  pointsAwardedThisGame: Record<string, number>;

  startGame: (setup: WavelengthSetup) => void;
  startRound: (guesserIndex: number) => void;
  switchCategory: (playerIndex: number) => void;
  recordExtraClueCategory: (id: string) => void;
  submitResult: (correct: boolean) => void;
  reset: () => void;
}

const INITIAL = {
  phase: "setup" as GamePhase,
  players: [] as Player[],
  maxNumber: 10,
  totalRounds: 0,
  totalTurns: 0,
  roundNumber: 1,
  currentRound: null as CurrentRound | null,
  history: [] as RoundResult[],
  categoryStyle: "simple" as "specific" | "simple",
  pointsAwardedThisGame: {} as Record<string, number>,
};

export const useWavelengthStore = create<WavelengthStore>((set, get) => ({
  ...INITIAL,

  startGame: (setup) => {
    set({
      phase: "playing",
      players: setup.players,
      maxNumber: setup.maxNumber,
      totalRounds: setup.totalRounds,
      totalTurns: setup.totalRounds * setup.players.length,
      roundNumber: 1,
      currentRound: null,
      history: [],
      categoryStyle: setup.categoryStyle,
      pointsAwardedThisGame: {},
    });
  },

  startRound: (guesserIndex) => {
    const { players, maxNumber } = get();
    const secretNumber = generateSecretNumber(maxNumber);
    const nonGuessers = players.filter((_, i) => i !== guesserIndex);
    const categories = pickCategories(nonGuessers.length);
    const playerCategories: PlayerCategory[] = nonGuessers.map((p, i) => ({
      player: p,
      category: categories[i],
    }));
    set({
      currentRound: {
        guesserIndex,
        secretNumber,
        playerCategories,
        categorySwitches: {},
        usedCategoryIds: categories.map((c) => c.id),
        extraClueUsedCategoryIds: [],
      },
    });
  },

  recordExtraClueCategory: (id) => {
    const { currentRound } = get();
    if (!currentRound) return;
    set({
      currentRound: {
        ...currentRound,
        extraClueUsedCategoryIds: [...currentRound.extraClueUsedCategoryIds, id],
      },
    });
  },

  switchCategory: (playerIndex) => {
    const { currentRound } = get();
    if (!currentRound) return;
    const { playerCategories, categorySwitches } = currentRound;
    const pc = playerCategories[playerIndex];
    if (!pc) return;
    const used = categorySwitches[pc.player.id] ?? 0;
    if (used >= MAX_SWITCHES_PER_ROUND) return;

    // Pick a replacement not already assigned to any player this round
    const assignedIds = new Set(playerCategories.map((p) => p.category.id));
    const available = CATEGORIES.filter((c) => !assignedIds.has(c.id));
    if (available.length === 0) return;
    const newCat = available[Math.floor(Math.random() * available.length)];

    set({
      currentRound: {
        ...currentRound,
        playerCategories: playerCategories.map((p, i) =>
          i === playerIndex ? { ...p, category: newCat } : p
        ),
        categorySwitches: {
          ...categorySwitches,
          [pc.player.id]: used + 1,
        },
      },
    });
  },

  submitResult: (correct) => {
    const { currentRound, players, roundNumber, totalTurns, history, pointsAwardedThisGame } = get();
    if (!currentRound) return;

    const { guesserIndex, secretNumber, playerCategories } = currentRound;
    const scoringMode = useSessionStore.getState().scoringMode;
    const { guesserScore, nonGuesserBonus } = scoreResult(correct, scoringMode);

    const addPoints = usePlayerStore.getState().addPoints;
    const guesser = players[guesserIndex];
    const updatedPointsAwarded = { ...pointsAwardedThisGame };
    if (guesserScore > 0) {
      addPoints(guesser.id, guesserScore);
      updatedPointsAwarded[guesser.id] = (updatedPointsAwarded[guesser.id] ?? 0) + guesserScore;
    }
    if (nonGuesserBonus > 0) {
      for (const { player } of playerCategories) {
        addPoints(player.id, nonGuesserBonus);
        updatedPointsAwarded[player.id] = (updatedPointsAwarded[player.id] ?? 0) + nonGuesserBonus;
      }
    }

    const result: RoundResult = {
      roundNumber,
      guesserPlayerId: guesser.id,
      secretNumber,
      correct,
      guesserScore,
      nonGuesserBonus,
    };

    const nextRound = roundNumber + 1;
    // Fix 7: game ends after totalRounds * players.length individual turns
    const isOver = nextRound > totalTurns;

    set({
      history: [...history, result],
      roundNumber: nextRound,
      currentRound: null,
      phase: isOver ? "game-over" : "playing",
      pointsAwardedThisGame: updatedPointsAwarded,
    });
  },

  reset: () => set({ ...INITIAL }),
}));
