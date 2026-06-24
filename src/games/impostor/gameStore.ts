import { create } from "zustand";
import type {
  ImpostorGameState,
  ImpostorSetup,
  Player,
  PlayerAssignment,
  VoteEntry,
  GamePhase,
} from "./types";
import { getRandomWord } from "./words";

interface ImpostorStore extends ImpostorGameState {
  // fixed once per game — for the "speaking order" shown on the discussion screen
  speakingOrder: Player[];
  pointsAwardedThisGame: Record<string, number>;

  startGame: (setup: ImpostorSetup) => void;
  advanceReveal: () => void;
  startDiscussion: () => void;
  startVoting: () => void;
  submitVote: (vote: VoteEntry) => void;
  advanceVoting: () => void;
  reset: () => void;
  setPhase: (phase: GamePhase) => void;
  recordPointsAwarded: (playerId: string, pts: number) => void;
}

const INITIAL_STATE: ImpostorGameState = {
  phase: "setup",
  setup: null,
  assignments: [],
  revealIndex: 0,
  votes: [],
  votingIndex: 0,
  secretWord: "",
};

function shufflePlayers(players: Player[]): Player[] {
  return [...players].sort(() => Math.random() - 0.5);
}

function buildAssignments(setup: ImpostorSetup): { assignments: PlayerAssignment[]; secretWord: string } {
  const secretWord = getRandomWord(setup.category);

  // Shuffle players to randomize who is the impostor
  const shuffled = [...setup.players].sort(() => Math.random() - 0.5);

  // Pick the first N shuffled players as impostors
  const impostorIds = new Set(shuffled.slice(0, setup.impostorCount).map((p) => p.id));

  // Re-order back to original player order for the reveal sequence
  const assignments: PlayerAssignment[] = setup.players.map((player) => ({
    player,
    role: impostorIds.has(player.id) ? "impostor" : "crewmate",
    word: impostorIds.has(player.id) ? undefined : secretWord,
  }));

  return { assignments, secretWord };
}

export const useImpostorStore = create<ImpostorStore>((set, get) => ({
  ...INITIAL_STATE,
  speakingOrder: [],
  pointsAwardedThisGame: {} as Record<string, number>,

  reset: () => set({ ...INITIAL_STATE, speakingOrder: [], pointsAwardedThisGame: {} }),

  startGame: (setup) => {
    const { assignments, secretWord } = buildAssignments(setup);
    set({
      setup,
      assignments,
      secretWord,
      revealIndex: 0,
      votes: [],
      votingIndex: 0,
      phase: "reveal",
      speakingOrder: shufflePlayers(setup.players),
      pointsAwardedThisGame: {},
    });
  },

  advanceReveal: () => {
    const { revealIndex, assignments } = get();
    if (revealIndex < assignments.length - 1) {
      set({ revealIndex: revealIndex + 1 });
    }
    // Caller navigates to discussion after last reveal
  },

  startDiscussion: () => set({ phase: "discussion" }),

  startVoting: () => set({ phase: "voting", votingIndex: 0, votes: [] }),

  submitVote: (vote) => {
    const { votes } = get();
    set({ votes: [...votes, vote] });
  },

  advanceVoting: () => {
    const { votingIndex, setup } = get();
    if (!setup) return;
    if (votingIndex < setup.players.length - 1) {
      set({ votingIndex: votingIndex + 1 });
    }
    // Caller navigates to results after last vote
  },

  setPhase: (phase) => set({ phase }),

  recordPointsAwarded: (playerId, pts) => {
    const { pointsAwardedThisGame } = get();
    set({
      pointsAwardedThisGame: {
        ...pointsAwardedThisGame,
        [playerId]: (pointsAwardedThisGame[playerId] ?? 0) + pts,
      },
    });
  },
}));

// Derived selectors — call these in components to avoid re-renders on unrelated state changes

export function computeResults(
  assignments: PlayerAssignment[],
  votes: VoteEntry[]
) {
  // Tally votes: accusedId → count
  const tally: Record<string, number> = {};
  for (const v of votes) {
    tally[v.accusedId] = (tally[v.accusedId] ?? 0) + 1;
  }

  const maxVotes = Math.max(...Object.values(tally), 0);
  const eliminatedIds = Object.entries(tally)
    .filter(([, count]) => count === maxVotes && maxVotes > 0)
    .map(([id]) => id);

  const isTie = eliminatedIds.length > 1;

  const impostors = assignments.filter((a) => a.role === "impostor").map((a) => a.player);
  const impostorIds = new Set(impostors.map((p) => p.id));

  // Win condition: all eliminated players are impostors AND all impostors are eliminated
  const allEliminatedAreImpostors = eliminatedIds.every((id) => impostorIds.has(id));
  const allImpostorsEliminated = impostors.every((p) => eliminatedIds.includes(p.id));
  const crewmatesWin = !isTie && allEliminatedAreImpostors && allImpostorsEliminated;

  return { tally, eliminatedIds, isTie, impostors, crewmatesWin };
}
