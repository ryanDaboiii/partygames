import { Audio } from "expo-av";

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
  Audio.Sound.createAsync(sfx[id], { shouldPlay: true })
    .then(({ sound }) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    })
    .catch((e) => {
      console.warn("SFX playback error:", e);
    });
}
