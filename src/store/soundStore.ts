import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setMusicMuted } from "../hooks/useGameMusic";
import { setSfxMuted } from "../hooks/useSoundEffects";

interface SoundStore {
  isMuted: boolean;
  toggleMute: () => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set, get) => ({
      isMuted: false,
      toggleMute: () => {
        const next = !get().isMuted;
        set({ isMuted: next });
        setMusicMuted(next);
        setSfxMuted(next);
      },
    }),
    {
      name: "sound-settings",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          setMusicMuted(state.isMuted);
          setSfxMuted(state.isMuted);
        }
      },
    }
  )
);
