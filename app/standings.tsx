import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../src/components/Button";
import { palette, spacing, typography } from "../src/theme";
import { usePlayerStore } from "../src/store/players";
import { useSessionStore } from "../src/store/session";

const ACCENT = palette.warning;

export default function StandingsScreen() {
  const router = useRouter();
  const players = usePlayerStore((s) => s.players);
  const resetScores = usePlayerStore((s) => s.resetScores);
  const resetAll = usePlayerStore((s) => s.resetAll);
  const clearSession = useSessionStore((s) => s.clearSession);

  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const ranks: number[] = [];
  sorted.forEach((p, i) => {
    if (i === 0) {
      ranks.push(1);
    } else if (p.totalScore === sorted[i - 1].totalScore) {
      ranks.push(ranks[i - 1]);
    } else {
      ranks.push(i + 1);
    }
  });

  const handleResetScores = () => {
    Alert.alert(
      "Reset Scores?",
      "All players will be set back to 0 points. The roster stays.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset Scores", style: "destructive", onPress: resetScores },
      ]
    );
  };

  const handleEndSession = () => {
    Alert.alert(
      "End Session?",
      "This clears the entire roster and all scores — the end-of-night reset. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: () => {
            resetAll();
            clearSession();
            router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.icon}>🏆</Text>
          <Text style={styles.title}>Standings</Text>
        </View>

        {sorted.length === 0 ? (
          <Text style={styles.emptyText}>
            No players yet — add players from the hub to start tracking scores.
          </Text>
        ) : (
          <View style={styles.list}>
            {sorted.map((p, i) => (
              <View key={p.id} style={[styles.row, ranks[i] === 1 && { borderColor: ACCENT }]}>
                <Text style={[styles.rank, ranks[i] === 1 && { color: ACCENT }]}>
                  {ranks[i] === 1 ? "🥇" : ranks[i] === 2 ? "🥈" : ranks[i] === 3 ? "🥉" : `${ranks[i]}.`}
                </Text>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={[styles.points, ranks[i] === 1 && { color: ACCENT }]}>
                  {p.totalScore} {p.totalScore === 1 ? "pt" : "pts"}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Button
            label="Reset Scores"
            onPress={handleResetScores}
            variant="secondary"
            accentColor={ACCENT}
            fullWidth
            disabled={sorted.length === 0}
          />
          <Button
            label="End Session / Reset All"
            onPress={handleEndSession}
            variant="danger"
            fullWidth
            disabled={sorted.length === 0}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
  back: { marginBottom: spacing.sm },
  backText: { ...typography.bodyBold, color: palette.muted },
  hero: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  icon: { fontSize: 56 },
  title: { ...typography.display, color: palette.white },
  emptyText: { ...typography.body, color: palette.muted, textAlign: "center" },
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  rank: { fontSize: 22, width: 34, textAlign: "center", color: palette.muted },
  name: { ...typography.bodyBold, color: palette.white, flex: 1 },
  points: { ...typography.heading3, color: palette.muted },
  actions: { gap: spacing.md, marginTop: spacing.md },
});
