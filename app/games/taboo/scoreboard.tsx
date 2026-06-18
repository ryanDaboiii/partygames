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
import { useTabooStore } from "../../../src/games/taboo/store";
import { useSessionStore } from "../../../src/store/session";
import { clearSessionCurrentGame } from "../../../src/firebase/sessions";

const ACCENT = palette.taboo;

export default function TabooScoreboardScreen() {
  const router = useRouter();
  const players = useTabooStore((s) => s.players);
  const gamePoints = useTabooStore((s) => s.gamePoints);
  const turnHistory = useTabooStore((s) => s.turnHistory);
  const totalRounds = useTabooStore((s) => s.totalRounds);
  const roundTimeSecs = useTabooStore((s) => s.roundTimeSecs);
  const startGame = useTabooStore((s) => s.startGame);
  const reset = useTabooStore((s) => s.reset);

  const mode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const scoringMode = useSessionStore((s) => s.scoringMode);

  // Sort players by gamePoints descending
  const ranked = [...players].sort((a, b) => (gamePoints[b] ?? 0) - (gamePoints[a] ?? 0));
  const topScore = ranked.length > 0 ? (gamePoints[ranked[0]] ?? 0) : 0;
  const winners = ranked.filter((n) => (gamePoints[n] ?? 0) === topScore);
  const isTie = winners.length > 1;

  // Per-player stats from history
  const playerStats: Record<string, { correct: number; passed: number; taboos: number }> = {};
  for (const p of players) playerStats[p] = { correct: 0, passed: 0, taboos: 0 };
  for (const turn of turnHistory) {
    const s = playerStats[turn.cluegiver];
    if (s) {
      s.correct += turn.correct;
      s.passed += turn.passed;
      s.taboos += turn.taboos;
    }
  }

  const handlePlayAgain = () => {
    startGame({ players, roundTimeSecs, totalRounds, scoringMode });
    router.replace("/games/taboo/turn-start");
  };

  const handleBackToHub = async () => {
    reset();
    if (mode === "online" && sessionCode) {
      try { await clearSessionCurrentGame(sessionCode); } catch (_) {}
    }
    router.replace("/hub");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          {isTie ? "🤝 It's a Tie!" : `🏆 ${winners[0]} Wins!`}
        </Text>

        {/* Rankings */}
        <View style={styles.rankList}>
          {ranked.map((name, idx) => {
            const isWinner = winners.includes(name);
            const pts = gamePoints[name] ?? 0;
            const stats = playerStats[name];
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;

            return (
              <View
                key={name}
                style={[styles.rankRow, isWinner && styles.rankRowWinner]}
              >
                <Text style={styles.medal}>{medal}</Text>
                <View style={styles.rankInfo}>
                  <Text style={[styles.rankName, isWinner && { color: ACCENT }]}>{name}</Text>
                  {stats && (
                    <View style={styles.statRow}>
                      <StatBit label="✓" value={stats.correct} color={palette.success} />
                      <StatBit label="⏭" value={stats.passed} color={palette.muted} />
                      <StatBit label="🚫" value={stats.taboos} color={palette.danger} />
                    </View>
                  )}
                </View>
                <Text style={[styles.rankScore, isWinner && { color: ACCENT }]}>{pts}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button
            label="Play Again"
            onPress={handlePlayAgain}
            accentColor={ACCENT}
            fullWidth
          />
          <Button
            label="Back to Hub"
            onPress={handleBackToHub}
            variant="ghost"
            accentColor={palette.muted}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBit({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={statStyles.container}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: { alignItems: "center", minWidth: 32 },
  value: { ...typography.bodyBold, color: palette.white },
  label: { fontSize: 10, color: palette.muted, marginTop: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },

  title: { ...typography.display, color: palette.white, textAlign: "center" },

  rankList: { gap: spacing.sm },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rankRowWinner: {
    borderColor: ACCENT,
    backgroundColor: ACCENT + "11",
    borderWidth: 1.5,
  },
  medal: { fontSize: 24, width: 36, textAlign: "center" },
  rankInfo: { flex: 1, gap: 4 },
  rankName: { ...typography.bodyBold, color: palette.white },
  statRow: { flexDirection: "row", gap: spacing.sm },
  rankScore: {
    fontSize: 32,
    fontWeight: "900",
    color: palette.white,
    minWidth: 40,
    textAlign: "right",
  },

  actions: { gap: spacing.sm, marginTop: spacing.md },
});
