import type { TabooCard } from "./types";
import { ALL_CARDS } from "./cards";

export const MAX_PASSES_PER_TURN = 10;

export function shuffleDeck(cards: TabooCard[]): TabooCard[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getFreshDeck(): TabooCard[] {
  return shuffleDeck(ALL_CARDS);
}
