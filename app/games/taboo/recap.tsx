import React, { useEffect } from "react";
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
import { useTabooStore, getCurrentCluegiver } from "../../../src/games/taboo/store";

const ACCENT = palette.taboo;

export default function RecapScreen() {
  const router = useRouter();

  const phase = useTabooStore((s) => s.phase);
  const players = useTabooStore((s) => s.players);
  const gamePoints = useTabooStore((s) => s.gamePoints);
  const turnHistory = useTabooStore((s) => s.turnHistory);
  const nextTurn = useTabooStore((s) => s.nextTurn);
  const totalTurnsPlayed = useTabooStore((s) => s.totalTurnsPlayed);
  const totalTurnsMax = useTabooStore((s) => s.totalTurnsMax);

  useEffect(() => {
    if (phase === "turn-start") router.replace("/games/taboo/turn-start");
    if (phase === "game-over") router.replace("/games/taboo/scoreboard");
    if (phase === "setup") router.replace("/games/taboo");
  }, [phase]);

  const lastTurn = turnHistory[turnHistory.length - 1];
  const turnsRemaining = totalTurnsMax - totalTurnsPlayed - 1;

  if (!lastTurn) {
    router.replace("/games/taboo/turn-start");
    return null;
  }

  const cluegiver = lastTurn.cluegiver;
  const turnNetPoints = Math.max(0, lastTurn.correct - lastTurn.passed - lastTurn.taboos);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Turn Over!</Text>
        <Text style={styles.subheading}>{cluegiver}'s turn</Text>

        {/* Net points earned */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Points this turn</Text>
          <Text style={[styles.pointsValue, turnNetPoints === 0 && { color: palette.muted }]}>
            +{turnNetPoints}
          </Text>
        </View>

        {/* Breakdown */}
        <View style={styles.breakdownCard}>
          <StatRow
            label="✅ Correct"
            value={lastTurn.correct}
            contribution={`+${lastTurn.correct}`}
            color={palette.success}
          />
          <StatRow
            label="🚫 Taboo"
            value={lastTurn.taboos}
            contribution={lastTurn.taboos > 0 ? `-${lastTurn.taboos}` : "0"}
            color={palette.danger}
          />
          <StatRow
            label="⏭ Passed"
            value={lastTurn.passed}
            contribution={lastTurn.passed > 0 ? `-${lastTurn.passed}` : "0"}
            color={palette.muted}
          />
          <View style={styles.breakdownDivider} />
          <View style={statStyles.row}>
            <Text style={statStyles.label}>Net score</Text>
            <Text style={[statStyles.value, { color: turnNetPoints > 0 ? ACCENT : palette.muted }]}>
              {turnNetPoints}
            </Text>
          </View>
        </View>

        {/* All players' game scores */}
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

        {turnsRemaining > 0 && (
          <Text style={styles.nextHint}>
            {turnsRemaining} turn{turnsRemaining !== 1 ? "s" : ""} remaining
          </Text>
        )}

        <Button
          label={turnsRemaining <= 0 ? "See Final Scores" : "Next Turn →"}
          onPress={nextTurn}
          accentColor={ACCENT}
          fullWidth
          style={styles.nextBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({
  label,
  value,
  contribution,
  color,
}: {
  label: string;
  value: number;
  contribution: string;
  color: string;
}) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <View style={statStyles.right}>
        <Text style={[statStyles.value, { color }]}>{value}</Text>
        <Text style={[statStyles.contribution, { color }]}>({contribution})</Text>
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  label: { ...typography.body, color: palette.muted },
  right: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  value: { ...typography.heading2, color: palette.white },
  contribution: { ...typography.caption, color: palette.muted },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },

  heading: { ...typography.display, color: palette.white, textAlign: "center" },
  subheading: { ...typography.body, color: palette.muted, textAlign: "center" },

  pointsCard: {
    backgroundColor: ACCENT + "22",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: ACCENT,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  pointsLabel: { ...typography.label, color: ACCENT },
  pointsValue: { fontSize: 64, fontWeight: "900", color: ACCENT },

  breakdownCard: {
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: spacing.sm,
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

  nextHint: {
    ...typography.caption,
    color: palette.border,
    textAlign: "center",
  },
  nextBtn: { marginTop: spacing.sm },
});
