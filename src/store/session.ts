import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SessionMode = "online" | "offline";
export type ScoringMode = "conventional" | "extended";

interface SessionState {
  sessionCode: string | null;
  isHost: boolean;
  mode: SessionMode | null;
  myPlayerName: string | null;
  scoringMode: ScoringMode;

  setSession: (data: {
    code: string | null;
    isHost: boolean;
    mode: SessionMode;
    myPlayerName?: string;
    scoringMode?: ScoringMode;
  }) => void;
  setScoringMode: (mode: ScoringMode) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionCode: null,
      isHost: false,
      mode: null,
      myPlayerName: null,
      scoringMode: "conventional",

      setSession: ({ code, isHost, mode, myPlayerName, scoringMode }) =>
        set({
          sessionCode: code,
          isHost,
          mode,
          myPlayerName: myPlayerName ?? null,
          scoringMode: scoringMode ?? "conventional",
        }),

      setScoringMode: (mode) => set({ scoringMode: mode }),

      clearSession: () =>
        set({
          sessionCode: null,
          isHost: false,
          mode: null,
          myPlayerName: null,
          scoringMode: "conventional",
        }),
    }),
    {
      name: "partygames-session",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
