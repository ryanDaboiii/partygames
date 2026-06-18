import React, { useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../src/components/Button";
import { palette, spacing, typography } from "../../../src/theme";
import { useTabooStore, getCurrentCluegiver } from "../../../src/games/taboo/store";

const ACCENT = palette.taboo;

export default function TurnStartScreen() {
  const router = useRouter();
  const phase = useTabooStore((s) => s.phase);
  const players = useTabooStore((s) => s.players);
  const totalTurnsPlayed = useTabooStore((s) => s.totalTurnsPlayed);
  const totalTurnsMax = useTabooStore((s) => s.totalTurnsMax);
  const totalRounds = useTabooStore((s) => s.totalRounds);
  const gamePoints = useTabooStore((s) => s.gamePoints);
  const startTurn = useTabooStore((s) => s.startTurn);

  useEffect(() => {
    if (phase === "game-over") router.replace("/games/taboo/scoreboard");
    if (phase === "setup") router.replace("/games/taboo");
  }, [phase]);

  const cluegiver = getCurrentCluegiver(players, totalTurnsPlayed);
  const currentRound = players.length > 0
    ? Math.floor(totalTurnsPlayed / players.length) + 1
    : 1;
  const turnsLeft = totalTurnsMax - totalTurnsPlayed;

  const handleStartTurn = () => {
    startTurn();
    router.replace("/games/taboo/turn");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Round info */}
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>Round {currentRound} of {totalRounds}</Text>
          <Text style={styles.turnsLeft}>{turnsLeft} turn{turnsLeft !== 1 ? "s" : ""} left</Text>
        </View>

        {/* Pass phone prompt */}
        <View style={styles.passCard}>
          <Text style={styles.passLabel}>Pass the phone to</Text>
          <Text style={styles.passName}>{cluegiver}</Text>
          <Text style={styles.passHint}>
            Hold it so only you can see the card.{"\n"}
            Everyone else guesses verbally!
          </Text>
        </View>

        {/* Scores this game */}
        <View style={styles.scoresSection}>
          <Text style={styles.scoresLabel}>Scores this game</Text>
          <View style={styles.scoresList}>
            {players.map((name) => (
              <View
                key={name}
                style={[styles.scoreRow, name === cluegiver && styles.scoreRowActive]}
              >
                <Text style={[styles.scoreName, name === cluegiver && { color: ACCENT }]}>
                  {name}
                </Text>
                <Text style={[styles.scoreValue, name === cluegiver && { color: ACCENT }]}>
                  {gamePoints[name] ?? 0}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Button
          label="I'm Ready →"
          onPress={handleStartTurn}
          accentColor={ACCENT}
          fullWidth
          style={styles.startBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },

  roundBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  roundText: { ...typography.label, color: palette.muted },
  turnsLeft: { ...typography.caption, color: palette.border },

  passCard: {
    backgroundColor: palette.bgCard,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: ACCENT,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  passLabel: { ...typography.label, color: ACCENT },
  passName: { ...typography.heading1, color: palette.white, textAlign: "center" },
  passHint: {
    ...typography.caption,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.sm,
  },

  scoresSection: { gap: spacing.md },
  scoresLabel: { ...typography.label, color: palette.muted },
  scoresList: { gap: spacing.sm },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scoreRowActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT + "11",
  },
  scoreName: { ...typography.bodyBold, color: palette.white },
  scoreValue: { ...typography.heading2, color: palette.white },

  startBtn: { marginTop: spacing.sm },
});
