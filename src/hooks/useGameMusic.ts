import { useEffect } from "react";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";

const VOLUME = 0.5;

const tracks = {
  impostor: require("../../assets/sounds/impostorgamesoundtrack.m4a"),
  wavelength: require("../../assets/sounds/wavelengthsoundtrack.m4a"),
  taboo: require("../../assets/sounds/taboosoundtrack.m4a"),
};

export type GameMusicId = keyof typeof tracks;

let currentSound: AudioPlayer | null = null;
let _muted = false;

export function stopMusic() {
  if (currentSound) {
    try {
      currentSound.pause();
      currentSound.remove();
    } catch (_) {}
    currentSound = null;
  }
}

export function playMusic(gameId: GameMusicId) {
  stopMusic();
  try {
    const player = createAudioPlayer(tracks[gameId]);
    player.loop = true;
    player.volume = _muted ? 0 : VOLUME;
    player.play();
    currentSound = player;
  } catch (_) {}
}

export function setMusicMuted(muted: boolean) {
  _muted = muted;
  if (currentSound) currentSound.volume = muted ? 0 : VOLUME;
}

/** Call at the top level of a game layout. Starts music on mount, stops on unmount. */
export function useGameMusic(gameId: GameMusicId) {
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
    }).catch(() => {});

    playMusic(gameId);

    return () => {
      stopMusic();
    };
  }, [gameId]);
}
