import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Player {
  id: string;
  name: string;
  totalScore: number;
  firebaseUid?: string;
}

interface PlayerStore {
  players: Player[];
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  addPoints: (playerId: string, points: number) => void;
  linkFirebaseUid: (localId: string, uid: string) => void;
  resetScores: () => void;
  resetAll: () => void;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      players: [],

      addPlayer: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const isDuplicate = get().players.some(
          (p) => p.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (isDuplicate) return;
        set((s) => ({
          players: [...s.players, { id: generateId(), name: trimmed, totalScore: 0 }],
        }));
      },

      removePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      addPoints: (playerId, points) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === playerId ? { ...p, totalScore: p.totalScore + points } : p
          ),
        })),

      linkFirebaseUid: (localId, uid) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === localId ? { ...p, firebaseUid: uid } : p
          ),
        })),

      resetScores: () =>
        set((s) => ({ players: s.players.map((p) => ({ ...p, totalScore: 0 })) })),

      resetAll: () => set({ players: [] }),
    }),
    {
      name: "partygames-players",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
