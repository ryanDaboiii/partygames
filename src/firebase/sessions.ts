import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { ensureAnonymousAuth } from "./rooms";
import { getRandomWord } from "../games/impostor/words";
import type { ImpostorCategory, PlayerRole } from "../games/impostor/types";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(length = 5): string {
  return Array.from({ length }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}

export interface ActiveGame {
  type: "impostor" | "wavelength";
  roomCode?: string;
}

export interface SessionPlayer {
  name: string;
}

export interface SessionImpostorGame {
  status: "discussion" | "ended";
  secretWord: string;
  impostorUids: string[];
  winner?: "crewmates" | "impostors";
}

export interface SessionData {
  hostId: string;
  hostName: string;
  players: Record<string, SessionPlayer>; // uid → { name }
  started: boolean;
  createdAt: Timestamp;
  activeGame: ActiveGame | null;
  impostorGame?: SessionImpostorGame;
  currentGame: "impostor" | "wavelength" | "taboo" | null;
  gameStatus: "selecting" | "in-progress" | "finished";
  ended?: boolean;
  scoringMode?: "conventional" | "extended";
}

// ── Session lifecycle ──────────────────────────────────────────────────────

export async function createOnlineSession(
  hostName: string
): Promise<{ sessionCode: string; hostUid: string }> {
  const user = await ensureAnonymousAuth();

  let code = generateCode();
  for (let i = 0; i < 5; i++) {
    const snap = await getDoc(doc(db, "sessions", code));
    if (!snap.exists()) break;
    code = generateCode();
  }

  await setDoc(doc(db, "sessions", code), {
    hostId: user.uid,
    hostName,
    players: { [user.uid]: { name: hostName } },
    started: false,
    createdAt: serverTimestamp(),
    activeGame: null,
  });

  return { sessionCode: code, hostUid: user.uid };
}

// Allows joining even if session has already started (mid-session join)
export async function joinOnlineSession(
  code: string,
  playerName: string
): Promise<{ playerUid: string }> {
  const user = await ensureAnonymousAuth();
  const sessionRef = doc(db, "sessions", code.toUpperCase());
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) throw new Error("Session not found — check the code and try again.");

  await updateDoc(sessionRef, {
    [`players.${user.uid}`]: { name: playerName },
  });

  return { playerUid: user.uid };
}

export async function startOnlineSession(code: string): Promise<void> {
  await updateDoc(doc(db, "sessions", code), { started: true });
}

export async function endOnlineSession(code: string): Promise<void> {
  await updateDoc(doc(db, "sessions", code), { ended: true });
}

export async function getOnlineSession(code: string): Promise<SessionData | null> {
  const snap = await getDoc(doc(db, "sessions", code.toUpperCase()));
  if (!snap.exists()) return null;
  return snap.data() as SessionData;
}

export async function setSessionActiveGame(
  code: string,
  game: ActiveGame | null
): Promise<void> {
  await updateDoc(doc(db, "sessions", code), { activeGame: game ?? null });
}

export function subscribeToSession(
  code: string,
  cb: (data: SessionData) => void
): () => void {
  return onSnapshot(doc(db, "sessions", code), (snap) => {
    if (snap.exists()) cb(snap.data() as SessionData);
  });
}

export function subscribeToSessionGame(
  code: string,
  cb: (game: ActiveGame | null) => void
): () => void {
  return onSnapshot(doc(db, "sessions", code), (snap) => {
    if (snap.exists()) {
      const data = snap.data() as SessionData;
      cb(data.activeGame ?? null);
    }
  });
}

// ── Impostor game (session-based, no separate room doc) ───────────────────

export async function startImpostorGame(
  sessionCode: string,
  sessionPlayers: Record<string, SessionPlayer>,
  category: ImpostorCategory,
  impostorCount: number
): Promise<void> {
  const secretWord = getRandomWord(category);
  const playerUids = Object.keys(sessionPlayers);
  const shuffled = [...playerUids].sort(() => Math.random() - 0.5);
  const impostorUidSet = new Set(shuffled.slice(0, impostorCount));

  // Write each player's private role doc under the session
  for (const uid of playerUids) {
    const role: PlayerRole = impostorUidSet.has(uid) ? "impostor" : "crewmate";
    await setDoc(doc(db, "sessions", sessionCode, "impostorRoles", uid), {
      role,
      ...(role === "crewmate" ? { word: secretWord } : {}),
    });
  }

  // Write game state into the session document
  await updateDoc(doc(db, "sessions", sessionCode), {
    activeGame: { type: "impostor" },
    impostorGame: {
      status: "discussion",
      secretWord,
      impostorUids: [...impostorUidSet],
    },
  });
}

export function subscribeToImpostorRole(
  sessionCode: string,
  uid: string,
  cb: (role: { role: PlayerRole; word?: string } | null) => void
): () => void {
  return onSnapshot(
    doc(db, "sessions", sessionCode, "impostorRoles", uid),
    (snap) => {
      if (snap.exists()) cb(snap.data() as { role: PlayerRole; word?: string });
      else cb(null);
    }
  );
}

export async function endImpostorGame(sessionCode: string): Promise<void> {
  await updateDoc(doc(db, "sessions", sessionCode), {
    "impostorGame.status": "ended",
  });
}

export async function setImpostorWinner(
  sessionCode: string,
  winner: "crewmates" | "impostors"
): Promise<void> {
  await updateDoc(doc(db, "sessions", sessionCode), {
    "impostorGame.winner": winner,
  });
}

// Called by the host when returning to hub — clears active game state
export async function clearImpostorSession(sessionCode: string): Promise<void> {
  await updateDoc(doc(db, "sessions", sessionCode), {
    activeGame: null,
    impostorGame: null,
  });
}

// ── Session-level game routing ─────────────────────────────────────────────

export async function setSessionCurrentGame(
  sessionCode: string,
  game: "impostor" | "wavelength" | "taboo"
): Promise<void> {
  await updateDoc(doc(db, "sessions", sessionCode), {
    currentGame: game,
    gameStatus: "in-progress",
  });
}

export async function clearSessionCurrentGame(sessionCode: string): Promise<void> {
  await updateDoc(doc(db, "sessions", sessionCode), {
    currentGame: null,
    gameStatus: "selecting",
  });
}

export async function setSessionScoringMode(
  sessionCode: string,
  mode: "conventional" | "extended"
): Promise<void> {
  await updateDoc(doc(db, "sessions", sessionCode), { scoringMode: mode });
}
