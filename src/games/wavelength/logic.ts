export function generateSecretNumber(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

export function scoreResult(
  correct: boolean,
  scoringMode: "conventional" | "extended"
): { guesserScore: number; nonGuesserBonus: number } {
  if (!correct) return { guesserScore: 0, nonGuesserBonus: 0 };
  return scoringMode === "extended"
    ? { guesserScore: 3, nonGuesserBonus: 1 }
    : { guesserScore: 1, nonGuesserBonus: 0 };
}
