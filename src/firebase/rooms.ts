/**
 * Firestore room schema
 *
 * /rooms/{roomCode}
 *   status: "lobby" | "revealing" | "discussion" | "voting" | "results"
 *   hostId: string         (Firebase anonymous UID)
 *   category: string
 *   impostorCount: number
 *   players: { uid: string; name: string }[]
 *   createdAt: Timestamp
 *
 * /rooms/{roomCode}/roles/{uid}
 *   role: "crewmate" | "impostor"
 *   word?: string
 *   // Security rule: only the owner uid can read their own document
 *
 * /rooms/{roomCode}/votes/{uid}
 *   accusedId: string
 *   // Security rule: only the owner uid can write; host can read all
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { auth, db } from "./config";
import { getRandomWord } from "../games/impostor/words";
import type { ImpostorCategory, PlayerAssignment, PlayerRole } from "../games/impostor/types";

export interface RoomPlayer {
  uid: string;
  name: string;
}

export interface RoomData {
  status: "lobby" | "revealing" | "discussion" | "voting" | "results" | "ended";
  hostId: string;
  category: ImpostorCategory;
  impostorCount: number;
  players: RoomPlayer[];
  createdAt: Timestamp;
  secretWord?: string;
  impostorUids?: string[];
  winner?: "crewmates" | "impostors";
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude ambiguous chars
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function ensureAnonymousAuth() {
  // Wait for Firebase Auth to finish loading its persisted state from storage.
  // Without this, auth.currentUser is briefly null on first mount even for a
  // signed-in user, causing signInAnonymously to create a brand-new UID that
  // doesn't match what's stored in Firestore player lists.
  await auth.authStateReady();
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser!;
}

export async function createRoom(
  category: ImpostorCategory,
  impostorCount: number,
  hostName: string
): Promise<{ roomCode: string; uid: string }> {
  const user = await ensureAnonymousAuth();

  // Try up to 5 codes to avoid collisions
  let roomCode = generateRoomCode();
  for (let i = 0; i < 5; i++) {
    const snap = await getDoc(doc(db, "rooms", roomCode));
    if (!snap.exists()) break;
    roomCode = generateRoomCode();
  }

  const roomData: RoomData = {
    status: "lobby",
    hostId: user.uid,
    category,
    impostorCount,
    players: [{ uid: user.uid, name: hostName }],
    createdAt: serverTimestamp() as Timestamp,
  };

  await setDoc(doc(db, "rooms", roomCode), roomData);
  return { roomCode, uid: user.uid };
}

export async function joinRoom(
  roomCode: string,
  playerName: string
): Promise<{ uid: string; roomData: RoomData }> {
  const user = await ensureAnonymousAuth();
  const roomRef = doc(db, "rooms", roomCode.toUpperCase());
  const snap = await getDoc(roomRef);

  if (!snap.exists()) throw new Error("Room not found");

  const roomData = snap.data() as RoomData;
  if (roomData.status !== "lobby") throw new Error("Game already started");

  const alreadyJoined = roomData.players.find((p) => p.uid === user.uid);
  if (!alreadyJoined) {
    await updateDoc(roomRef, {
      players: [...roomData.players, { uid: user.uid, name: playerName }],
    });
  }

  return { uid: user.uid, roomData };
}

export async function startOnlineGame(roomCode: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomCode);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error("Room not found");

  const room = snap.data() as RoomData;
  const secretWord = getRandomWord(room.category);

  // Assign impostors randomly
  const shuffled = [...room.players].sort(() => Math.random() - 0.5);
  const impostorUids = new Set(shuffled.slice(0, room.impostorCount).map((p) => p.uid));

  // Write each player's private role doc
  const rolesCol = collection(db, "rooms", roomCode, "roles");
  for (const player of room.players) {
    const role: PlayerRole = impostorUids.has(player.uid) ? "impostor" : "crewmate";
    await setDoc(doc(rolesCol, player.uid), {
      role,
      ...(role === "crewmate" ? { word: secretWord } : {}),
    });
  }

  await updateDoc(roomRef, { status: "discussion", secretWord, impostorUids: [...impostorUids] });
}

export async function submitOnlineVote(
  roomCode: string,
  accusedId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await setDoc(doc(db, "rooms", roomCode, "votes", user.uid), { accusedId });
}

export async function endOnlineGame(roomCode: string): Promise<void> {
  await updateDoc(doc(db, "rooms", roomCode), { status: "ended" });
}

export async function setOnlineWinner(
  roomCode: string,
  winner: "crewmates" | "impostors"
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomCode), { winner });
}

export function subscribeToRoom(
  roomCode: string,
  callback: (data: RoomData) => void
): () => void {
  return onSnapshot(doc(db, "rooms", roomCode), (snap) => {
    if (snap.exists()) callback(snap.data() as RoomData);
  });
}
