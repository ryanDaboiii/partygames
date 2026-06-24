import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { GameButton } from "../../../src/components/GameButton";
import { BackButton } from "../../../src/components/BackButton";
import { ExitGameDialog } from "../../../src/components/ExitGameDialog";
import { palette, spacing, typography, scaleFont, shadows } from "../../../src/theme";
import { useTabooStore, getCurrentCluegiver } from "../../../src/games/taboo/store";
import { usePlayerStore } from "../../../src/store/players";
import { useSessionStore } from "../../../src/store/session";
import { clearSessionCurrentGame } from "../../../src/firebase/sessions";
import { getGameTheme } from "../../../src/games/registry";
import { CheckIcon } from "../../../src/assets/icons/CheckIcon";
import { BanIcon } from "../../../src/assets/icons/BanIcon";
import { SkipIcon } from "../../../src/assets/icons/SkipIcon";

const GAME_THEME = getGameTheme("taboo");
const ACCENT = GAME_THEME.accent;

export default function RecapScreen() {
  const router = useRouter();

  const phase = useTabooStore((s) => s.phase);
  const players = useTabooStore((s) => s.players);
  const gamePoints = useTabooStore((s) => s.gamePoints);
  const turnHistory = useTabooStore((s) => s.turnHistory);
  const nextTurn = useTabooStore((s) => s.nextTurn);
  const totalTurnsPlayed = useTabooStore((s) => s.totalTurnsPlayed);
  const totalTurnsMax = useTabooStore((s) => s.totalTurnsMax);
  const reset = useTabooStore((s) => s.reset);
  const localPlayers = usePlayerStore((s) => s.players);
  const addPoints = usePlayerStore((s) => s.addPoints);
  const mode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const isHost = useSessionStore((s) => s.isHost);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    if (phase === "turn-start") router.replace("/games/taboo/turn-start");
    if (phase === "game-over") router.replace("/games/taboo/scoreboard");
    if (phase === "setup") router.replace("/games/taboo");
  }, [phase]);

  const handleExitKeep = async () => {
    if (mode === "online" && isHost && sessionCode) {
      try { await clearSessionCurrentGame(sessionCode); } catch (_) {}
    }
    reset();
    router.replace('/hub');
  };
  const handleExitVoid = async () => {
    Object.entries(gamePoints).forEach(([name, pts]) => {
      if (pts > 0) {
        const match = localPlayers.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (match) addPoints(match.id, -pts);
      }
    });
    if (mode === "online" && isHost && sessionCode) {
      try { await clearSessionCurrentGame(sessionCode); } catch (_) {}
    }
    reset();
    router.replace('/hub');
  };

  const lastTurn = turnHistory[turnHistory.length - 1];
  const turnsRemaining = totalTurnsMax - totalTurnsPlayed - 1;

  if (!lastTurn) {
    router.replace("/games/taboo/turn-start");
    return null;
  }

  const cluegiver = lastTurn.cluegiver;
  const turnNetPoints = Math.max(0, lastTurn.correct - lastTurn.taboos);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
      <ExitGameDialog
        visible={showExitDialog}
        onKeepScores={handleExitKeep}
        onVoidPoints={handleExitVoid}
        onCancel={() => setShowExitDialog(false)}
      />
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
            label={<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><CheckIcon size={16} /><Text style={statStyles.label}>Correct</Text></View>}
            value={lastTurn.correct}
            contribution={`+${lastTurn.correct}`}
            color={ACCENT}
          />
          <StatRow
            label={<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><BanIcon size={16} /><Text style={statStyles.label}>Taboo</Text></View>}
            value={lastTurn.taboos}
            contribution={lastTurn.taboos > 0 ? `-${lastTurn.taboos}` : "0"}
            color={palette.danger}
          />
          <StatRow
            label={<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><SkipIcon size={16} /><Text style={statStyles.label}>Passed</Text></View>}
            value={lastTurn.passed}
            contribution="0"
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

        <GameButton
          label={turnsRemaining <= 0 ? "See Final Scores" : "Next Turn →"}
          onPress={nextTurn}
          color={ACCENT}
          textColor={GAME_THEME.text}
          fullWidth
          style={styles.nextBtn}
        />
      </ScrollView>
      <BackButton onPress={() => setShowExitDialog(true)} color={GAME_THEME.accent} />
    </SafeAreaView>
  );
}

function StatRow({
  label,
  value,
  contribution,
  color,
}: {
  label: React.ReactNode;
  value: number;
  contribution: string;
  color: string;
}) {
  return (
    <View style={statStyles.row}>
      <View style={{ flex: 1 }}>{label}</View>
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
  safe: { flex: 1 },
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
    ...shadows.md,
  },
  pointsLabel: { ...typography.label, color: ACCENT },
  pointsValue: { fontSize: scaleFont(64), fontWeight: "900", color: ACCENT },

  breakdownCard: {
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.sm,
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
    ...shadows.sm,
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
