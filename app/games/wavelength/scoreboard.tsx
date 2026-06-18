import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../src/components/Button";
import { palette, spacing, typography } from "../../../src/theme";
import { useWavelengthStore } from "../../../src/games/wavelength/store";
import { useSessionStore } from "../../../src/store/session";
import { clearSessionCurrentGame } from "../../../src/firebase/sessions";

const ACCENT = palette.wavelength;

export default function ScoreboardScreen() {
  const router = useRouter();
  const players = useWavelengthStore((s) => s.players);
  const history = useWavelengthStore((s) => s.history);
  const maxNumber = useWavelengthStore((s) => s.maxNumber);
  const totalRounds = useWavelengthStore((s) => s.totalRounds);
  const startGame = useWavelengthStore((s) => s.startGame);
  const reset = useWavelengthStore((s) => s.reset);
  const mode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);

  // Points earned this game only (round summary) — full cumulative totals live in Standings
  const gameScores: Record<string, number> = {};
  for (const p of players) gameScores[p.id] = 0;
  for (const r of history) {
    gameScores[r.guesserPlayerId] = (gameScores[r.guesserPlayerId] ?? 0) + r.guesserScore;
    if (r.correct) {
      for (const p of players) {
        if (p.id !== r.guesserPlayerId) {
          gameScores[p.id] = (gameScores[p.id] ?? 0) + r.nonGuesserBonus;
        }
      }
    }
  }

  const sorted = players
    .map((p) => ({ ...p, score: gameScores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const isTie = sorted.length >= 2 && sorted[0].score === sorted[1].score;
  const winner = sorted.length > 0 && !isTie ? sorted[0] : null;

  const handlePlayAgain = () => {
    const samePlayers = players.map((p) => ({ ...p }));
    reset();
    startGame({ players: samePlayers, maxNumber, totalRounds });
    router.replace("/games/wavelength/round");
  };

  const handleHome = async () => {
    reset();
    if (mode === "online" && sessionCode) {
      try { await clearSessionCurrentGame(sessionCode); } catch (_) {}
    }
    router.replace("/hub");
  };

  const handleViewStandings = () => {
    reset();
    router.replace("/standings");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Winner banner */}
        <View
          style={[
            styles.banner,
            { backgroundColor: isTie ? palette.warning + "22" : ACCENT + "22", borderColor: isTie ? palette.warning : ACCENT },
          ]}
        >
          <Text style={styles.bannerEmoji}>{isTie ? "🤝" : "🏆"}</Text>
          <Text style={[styles.bannerTitle, { color: isTie ? palette.warning : ACCENT }]}>
            {isTie ? "It's a Tie!" : winner ? `${winner.name} Wins!` : "Game Over"}
          </Text>
          <Text style={styles.bannerSub}>
            {sorted[0]?.score ?? 0} {isTie ? `– ${sorted[1]?.score ?? 0}` : "points"}
          </Text>
        </View>

        {/* Round summary — points earned this game */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>This Game</Text>
          {sorted.map((p, i) => (
            <View
              key={p.id}
              style={[styles.scoreRow, i === 0 && !isTie && { borderColor: ACCENT }]}
            >
              <Text style={styles.rank}>
                {i === 0 && !isTie ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
              </Text>
              <Text style={styles.scoreName}>{p.name}</Text>
              <Text style={[styles.scorePoints, i === 0 && !isTie && { color: ACCENT }]}>
                {p.score} pts
              </Text>
            </View>
          ))}
        </View>

        {/* Round recap */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Round Recap</Text>
          {history.map((r, i) => {
            const guesser = players.find((p) => p.id === r.guesserPlayerId);
            return (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyRound}>R{r.roundNumber}</Text>
                <View style={styles.historyMid}>
                  <Text style={styles.historyGuesser}>{guesser?.name ?? "?"}</Text>
                  <Text style={styles.historyNumbers}>
                    Secret was {r.secretNumber} — {r.correct ? "Got it! 🎯" : "Wrong"}
                  </Text>
                </View>
                <View style={[styles.historyScore, { borderColor: ptColor(r.guesserScore), backgroundColor: ptColor(r.guesserScore) + "22" }]}>
                  <Text style={[styles.historyScoreText, { color: ptColor(r.guesserScore) }]}>
                    {r.guesserScore > 0 ? `+${r.guesserScore}` : "0"}
                  </Text>
                  {r.nonGuesserBonus > 0 && (
                    <Text style={styles.historyScoreBonus}>+{r.nonGuesserBonus} ea.</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button label="Play Again" onPress={handlePlayAgain} accentColor={ACCENT} fullWidth />
          <Button
            label="View Standings"
            onPress={handleViewStandings}
            variant="secondary"
            accentColor={ACCENT}
            fullWidth
          />
          <Button
            label="Back to Hub"
            onPress={handleHome}
            variant="ghost"
            accentColor={ACCENT}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ptColor(score: number): string {
  if (score >= 5) return palette.warning;
  if (score >= 3) return palette.success;
  if (score >= 1) return palette.wavelength;
  return palette.muted;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
  banner: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  bannerEmoji: { fontSize: 56 },
  bannerTitle: { ...typography.heading1 },
  bannerSub: { ...typography.heading3, color: palette.muted },
  section: { gap: spacing.md },
  sectionLabel: { ...typography.label, color: palette.muted },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  rank: { fontSize: 22, width: 34 },
  scoreName: { ...typography.bodyBold, color: palette.white, flex: 1 },
  scorePoints: { ...typography.heading3, color: palette.muted },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  historyRound: { ...typography.label, color: palette.muted, width: 28 },
  historyMid: { flex: 1, gap: 2 },
  historyGuesser: { ...typography.caption, color: palette.muted },
  historyNumbers: { ...typography.bodyBold, color: palette.white },
  historyScore: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 44,
    alignItems: "center",
  },
  historyScoreText: { ...typography.bodyBold },
  historyScoreBonus: { ...typography.label, color: palette.muted, fontSize: 9 },
  actions: { gap: spacing.md },
});
