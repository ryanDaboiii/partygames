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
import { palette, spacing, typography, shadows } from "../../../src/theme";
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

  const nextPlayerIndex = (players.indexOf(cluegiver) + 1) % players.length;
  const nextPlayerName = players[nextPlayerIndex] ?? "next player";
  const isLastTurn = turnsRemaining <= 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
      <ExitGameDialog
        visible={showExitDialog}
        onKeepScores={handleExitKeep}
        onVoidPoints={handleExitVoid}
        onCancel={() => setShowExitDialog(false)}
      />

      {/* Fixed top — always visible, never scrolls */}
      <View style={styles.fixedTop}>
        <Text style={styles.heading}>Turn Over!</Text>
        <Text style={styles.nextPlayerText}>
          {isLastTurn ? "Game over!" : `Pass the phone to ${nextPlayerName}`}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <CheckIcon size={16} />
            <Text style={[styles.statValue, { color: ACCENT }]}>{lastTurn.correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statChip}>
            <SkipIcon size={16} />
            <Text style={[styles.statValue, { color: palette.muted }]}>{lastTurn.passed}</Text>
            <Text style={styles.statLabel}>Passed</Text>
          </View>
          <View style={styles.statChip}>
            <BanIcon size={16} />
            <Text style={[styles.statValue, { color: palette.danger }]}>{lastTurn.taboos}</Text>
            <Text style={styles.statLabel}>Taboo</Text>
          </View>
        </View>

        <Text style={styles.netScore}>
          {turnNetPoints > 0 ? `+${turnNetPoints}` : `${turnNetPoints}`} pts this turn
        </Text>

        <GameButton
          label={turnsRemaining <= 0 ? "See Final Scores" : "Next Turn →"}
          onPress={nextTurn}
          color={ACCENT}
          textColor={GAME_THEME.text}
          fullWidth
        />
      </View>

      {/* Scrollable scoreboard */}
      <ScrollView
        style={styles.scoreboardScroll}
        contentContainerStyle={styles.scoreboardContent}
        showsVerticalScrollIndicator={false}
      >
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
        {turnsRemaining > 0 && (
          <Text style={styles.nextHint}>
            {turnsRemaining} turn{turnsRemaining !== 1 ? "s" : ""} remaining
          </Text>
        )}
      </ScrollView>

      <BackButton onPress={() => setShowExitDialog(true)} color={GAME_THEME.accent} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  fixedTop: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    gap: spacing.sm,
  },
  heading: { ...typography.display, color: palette.white, textAlign: "center" },
  nextPlayerText: { fontSize: 20, fontWeight: "700", color: palette.white, textAlign: "center" },

  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
  },
  statChip: {
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 72,
  },
  statValue: { ...typography.heading2, color: palette.white },
  statLabel: { ...typography.caption, color: palette.muted },

  netScore: {
    ...typography.bodyBold,
    color: GAME_THEME.accentLight,
    textAlign: "center",
  },

  scoreboardScroll: { flex: 1 },
  scoreboardContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  scoresLabel: { ...typography.label, color: palette.muted, textAlign: "center" },
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
});
