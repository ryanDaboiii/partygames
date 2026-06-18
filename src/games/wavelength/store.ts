import { create } from "zustand";
import type { Player, PlayerCategory, CurrentRound, WavelengthSetup, GamePhase, RoundResult } from "./types";
import { generateSecretNumber, scoreResult } from "./logic";
import { pickCategories } from "./categories";
import { usePlayerStore } from "../../store/players";

interface WavelengthStore {
  phase: GamePhase;
  players: Player[];
  maxNumber: number;
  totalRounds: number;
  roundNumber: number;
  currentRound: CurrentRound | null;
  history: RoundResult[];

  startGame: (setup: WavelengthSetup) => void;
  startRound: (guesserIndex: number) => void;
  submitResult: (correct: boolean) => void;
  reset: () => void;
}

const INITIAL = {
  phase: "setup" as GamePhase,
  players: [] as Player[],
  maxNumber: 10,
  totalRounds: 0,
  roundNumber: 1,
  currentRound: null as CurrentRound | null,
  history: [] as RoundResult[],
};

export const useWavelengthStore = create<WavelengthStore>((set, get) => ({
  ...INITIAL,

  startGame: (setup) => {
    set({
      phase: "playing",
      players: setup.players,
      maxNumber: setup.maxNumber,
      totalRounds: setup.totalRounds,
      roundNumber: 1,
      currentRound: null,
      history: [],
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
      currentRound: { guesserIndex, secretNumber, playerCategories },
    });
  },

  submitResult: (correct) => {
    const { currentRound, players, roundNumber, totalRounds, history } = get();
    if (!currentRound) return;

    const { guesserIndex, secretNumber, playerCategories } = currentRound;
    const { guesserScore, nonGuesserBonus } = scoreResult(correct);

    const addPoints = usePlayerStore.getState().addPoints;
    const guesser = players[guesserIndex];
    addPoints(guesser.id, guesserScore); // guesser: +5 for correct, 0 for wrong
    for (const { player } of playerCategories) {
      addPoints(player.id, nonGuesserBonus); // each non-guesser: +2 for correct, 0 for wrong
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
    const isOver = nextRound > totalRounds;

    set({
      history: [...history, result],
      roundNumber: nextRound,
      currentRound: null,
      phase: isOver ? "game-over" : "playing",
    });
  },

  reset: () => set({ ...INITIAL }),
}));
