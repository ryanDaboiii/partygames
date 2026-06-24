import { createAudioPlayer } from "expo-audio";

const sfx = {
  correct: require("../../assets/sounds/correct.wav"),
  wrong: require("../../assets/sounds/wrong.wav"),
  fanfare: require("../../assets/sounds/fanfare.wav"),
};

type SfxId = keyof typeof sfx;

let isMuted = false;

export function setSfxMuted(muted: boolean) {
  isMuted = muted;
}

export function playSfx(id: SfxId) {
  if (isMuted) return;
  try {
    const player = createAudioPlayer(sfx[id]);
    player.play();
    player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        player.remove();
      }
    });
  } catch (e) {
    console.warn("SFX playback error:", e);
  }
}
