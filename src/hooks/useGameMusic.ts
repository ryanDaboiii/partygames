import { useEffect } from "react";
import { Audio } from "expo-av";

const VOLUME = 0.5;

const tracks = {
  impostor: require("../../assets/sounds/impostorgamesoundtrack.m4a"),
  wavelength: require("../../assets/sounds/wavelengthsoundtrack.m4a"),
  taboo: require("../../assets/sounds/taboosoundtrack.m4a"),
  menu: require("../../assets/sounds/mainmenumusic.m4a"),
};

export type GameMusicId = keyof typeof tracks;

let currentSound: Audio.Sound | null = null;
let _muted = false;
let _pendingTrack: GameMusicId | null = null;
let isChanging = false;

export function stopMusic() {
  _pendingTrack = null;
  if (currentSound) {
    const s = currentSound;
    currentSound = null;
    s.stopAsync().catch(() => {});
    s.unloadAsync().catch(() => {});
  }
}

export async function playMusic(gameId: GameMusicId) {
  if (isChanging) return;
  isChanging = true;
  try {
    await stopMusic();
    const { sound } = await Audio.Sound.createAsync(tracks[gameId], {
      isLooping: true,
      volume: _muted ? 0 : VOLUME,
      shouldPlay: true,
    });
    currentSound = sound;
  } catch (e) {
    console.warn("Music load failed:", e);
  } finally {
    isChanging = false;
  }
}

export function setMusicMuted(muted: boolean) {
  _muted = muted;
  if (currentSound) currentSound.setVolumeAsync(muted ? 0 : VOLUME).catch(() => {});
}

/** Call at the top level of a game layout. Starts music on mount, stops on unmount. */
export function useGameMusic(gameId: GameMusicId | null) {
  useEffect(() => {
    if (!gameId) {
      stopMusic();
      return;
    }

    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    }).catch(() => {});

    playMusic(gameId);

    return () => {
      stopMusic();
    };
  }, [gameId]);
}
