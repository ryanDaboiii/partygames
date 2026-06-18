export function generateSecretNumber(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

export function scoreResult(correct: boolean): { guesserScore: number; nonGuesserBonus: number } {
  return correct ? { guesserScore: 5, nonGuesserBonus: 2 } : { guesserScore: 0, nonGuesserBonus: 0 };
}
