import { useEffect } from "react";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";

const VOLUME = 0.5;

const tracks = {
  impostor: require("../../assets/sounds/impostorgamesoundtrack.m4a"),
  wavelength: require("../../assets/sounds/wavelengthsoundtrack.m4a"),
  taboo: require("../../assets/sounds/taboosoundtrack.m4a"),
  menu: require("../../assets/sounds/mainmenumusic.m4a"),
};

export type GameMusicId = keyof typeof tracks;

let currentPlayer: AudioPlayer | null = null;
let _muted = false;
let isChanging = false;

export function stopMusic() {
  if (currentPlayer) {
    const p = currentPlayer;
    currentPlayer = null;
    try { p.remove(); } catch {}
  }
}

export async function playMusic(gameId: GameMusicId) {
  if (isChanging) return;
  isChanging = true;
  try {
    stopMusic();
    const player = createAudioPlayer(tracks[gameId]);
    player.loop = true;
    player.volume = _muted ? 0 : VOLUME;
    player.play();
    currentPlayer = player;
  } catch (e) {
    if (__DEV__) console.warn("Music load failed:", e);
  } finally {
    isChanging = false;
  }
}

export function setMusicMuted(muted: boolean) {
  _muted = muted;
  if (currentPlayer) currentPlayer.volume = muted ? 0 : VOLUME;
}

/** Call at the top level of a game layout. Starts music on mount, stops on unmount. */
export function useGameMusic(gameId: GameMusicId | null) {
  useEffect(() => {
    if (!gameId) {
      stopMusic();
      return;
    }

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(() => {});

    playMusic(gameId);

    return () => {
      stopMusic();
    };
  }, [gameId]);
}
