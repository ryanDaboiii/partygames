import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./config";

export interface WavelengthFSAssignment {
  categoryName: string;
  categoryHint: string;
}

export interface WavelengthFSState {
  phase: "reveal" | "clue" | "guessing-prep" | "guess" | "result";
  round: number;               // 1-indexed turn counter (each guesser turn = 1 turn)
  totalRounds: number;         // configured cycles (UI label "rounds")
  totalTurns: number;          // totalRounds * playerOrder.length
  guesserId: string;           // Firebase UID of current guesser
  secretNumber: number;
  range: number;               // 1..range
  playerOrder: string[];       // UIDs in fixed rotation order
  playerNames: Record<string, string>;          // uid → display name
  assignments: Record<string, WavelengthFSAssignment>; // uid → category (non-guessers only)
  categorySwitches: Record<string, number>;     // uid → switches used this round
  turnOrder: string[];         // shuffled non-guesser UIDs for clue phase
  currentTurnIndex: number;    // index into turnOrder
  revealedBy: string[];         // UIDs of non-guessers who completed hold-to-reveal this round
  guess: number | null;        // guesser's submitted number
  result: { correct: boolean } | null;
}

const stateRef = (sessionCode: string) =>
  doc(db, "sessions", sessionCode, "wavelength", "state");

export async function startWavelengthRound(
  sessionCode: string,
  state: WavelengthFSState,
): Promise<void> {
  await setDoc(stateRef(sessionCode), state);
}

export async function requestWavelengthExtraClue(
  sessionCode: string,
  selectedUid: string,
): Promise<void> {
  await updateDoc(stateRef(sessionCode), {
    phase: "clue",
    turnOrder: [selectedUid],
    currentTurnIndex: 0,
  });
}

export async function markWavelengthRevealed(
  sessionCode: string,
  uid: string,
): Promise<void> {
  await updateDoc(stateRef(sessionCode), {
    revealedBy: arrayUnion(uid),
  });
}

export async function switchWavelengthCategory(
  sessionCode: string,
  uid: string,
  assignment: WavelengthFSAssignment,
  newSwitchCount: number,
): Promise<void> {
  await updateDoc(stateRef(sessionCode), {
    [`assignments.${uid}`]: assignment,
    [`categorySwitches.${uid}`]: newSwitchCount,
  });
}

export async function startWavelengthCluePhase(
  sessionCode: string,
  turnOrder: string[],
): Promise<void> {
  await updateDoc(stateRef(sessionCode), {
    phase: "clue",
    turnOrder,
    currentTurnIndex: 0,
  });
}

export async function advanceWavelengthClueTurn(
  sessionCode: string,
  nextIndex: number,
  phase: "clue" | "guessing-prep",
): Promise<void> {
  await updateDoc(stateRef(sessionCode), {
    currentTurnIndex: nextIndex,
    phase,
  });
}

export async function advanceToWavelengthGuess(sessionCode: string): Promise<void> {
  await updateDoc(stateRef(sessionCode), { phase: "guess" });
}

export async function submitWavelengthGuess(
  sessionCode: string,
  guess: number,
  secretNumber: number,
): Promise<void> {
  await updateDoc(stateRef(sessionCode), {
    phase: "result",
    guess,
    result: { correct: guess === secretNumber },
  });
}

export function subscribeToWavelengthState(
  sessionCode: string,
  cb: (state: WavelengthFSState | null) => void,
): () => void {
  return onSnapshot(stateRef(sessionCode), (snap) => {
    if (snap.exists()) cb(snap.data() as WavelengthFSState);
    else cb(null);
  });
}

export async function clearWavelengthState(sessionCode: string): Promise<void> {
  await deleteDoc(stateRef(sessionCode));
}
