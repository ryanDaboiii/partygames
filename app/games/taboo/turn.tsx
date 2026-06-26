import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { palette, spacing, typography, scaleFont, shadows } from "../../../src/theme";
import { useTabooStore, getCurrentCluegiver } from "../../../src/games/taboo/store";
import { usePlayerStore } from "../../../src/store/players";
import { useSessionStore } from "../../../src/store/session";
import { clearSessionCurrentGame } from "../../../src/firebase/sessions";
import { MAX_PASSES_PER_TURN } from "../../../src/games/taboo/logic";
import { getGameTheme } from "../../../src/games/registry";
import { BackButton } from "../../../src/components/BackButton";
import { ExitGameDialog } from "../../../src/components/ExitGameDialog";
import { PauseIcon } from "../../../src/assets/icons/PauseIcon";
import { XIcon } from "../../../src/assets/icons/XIcon";
import { BanIcon } from "../../../src/assets/icons/BanIcon";
import { CheckIcon } from "../../../src/assets/icons/CheckIcon";
import { playSfx } from "../../../src/hooks/useSoundEffects";

const GAME_THEME = getGameTheme("taboo");
const ACCENT = GAME_THEME.accent;

export default function TurnScreen() {
  const router = useRouter();

  const phase = useTabooStore((s) => s.phase);
  const deck = useTabooStore((s) => s.deck);
  const cardIndex = useTabooStore((s) => s.cardIndex);
  const roundTimeSecs = useTabooStore((s) => s.roundTimeSecs);
  const passesUsed = useTabooStore((s) => s.passesUsed);
  const totalTurnsPlayed = useTabooStore((s) => s.totalTurnsPlayed);
  const players = useTabooStore((s) => s.players);
  const turnCorrect = useTabooStore((s) => s.turnCorrect);
  const turnTaboos = useTabooStore((s) => s.turnTaboos);
  const turnNetScore = useTabooStore((s) => s.turnNetScore);
  const gotItAction = useTabooStore((s) => s.gotIt);
  const passAction = useTabooStore((s) => s.pass);
  const tabooAction = useTabooStore((s) => s.taboo);
  const endTurn = useTabooStore((s) => s.endTurn);
  const gamePoints = useTabooStore((s) => s.gamePoints);
  const reset = useTabooStore((s) => s.reset);

  const localPlayers = usePlayerStore((s) => s.players);
  const addPoints = usePlayerStore((s) => s.addPoints);

  const mode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const isHost = useSessionStore((s) => s.isHost);

  const [timeLeft, setTimeLeft] = useState(roundTimeSecs);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const cluegiver = getCurrentCluegiver(players, totalTurnsPlayed);
  const card = deck[cardIndex % deck.length];

  useEffect(() => {
    if (phase === "turn-recap") {
      const match = localPlayers.find(
        (p) => p.name.toLowerCase() === cluegiver.toLowerCase()
      );
      if (match) addPoints(match.id, turnNetScore);
      router.replace("/games/taboo/recap");
    }
    if (phase === "setup") router.replace("/games/taboo");
  }, [phase]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (timeLeft === 0) endTurn();
  }, [timeLeft]);

  const timeColor =
    timeLeft <= 10 ? palette.danger : timeLeft <= 20 ? palette.warning : ACCENT;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeDisplay = mins > 0
    ? `${mins}:${secs.toString().padStart(2, "0")}`
    : `0:${secs.toString().padStart(2, "0")}`;

  const passesLeft = MAX_PASSES_PER_TURN - passesUsed;
  const canPass = passesLeft > 0;

  const handlePause = () => setIsPaused(true);

  if (!card) return null;

  const liveScore = Math.max(0, turnCorrect - turnTaboos);

  const handleGotIt = () => { playSfx("correct"); gotItAction(); };
  const handleTaboo = () => { playSfx("wrong"); tabooAction(); };

  const handleExitKeep = async () => {
    const partialScore = Math.max(0, turnCorrect - turnTaboos);
    if (partialScore > 0) {
      const match = localPlayers.find((p) => p.name.toLowerCase() === cluegiver.toLowerCase());
      if (match) addPoints(match.id, partialScore);
    }
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
      <ExitGameDialog
        visible={showExitDialog}
        onKeepScores={handleExitKeep}
        onVoidPoints={handleExitVoid}
        onCancel={() => setShowExitDialog(false)}
      />
      {/* Player name and live points */}
      <View style={styles.topBar}>
        <Text style={styles.playerName}>{cluegiver}</Text>
        <Text style={styles.livePoints}>{liveScore} pts</Text>
      </View>

      {/* Timer + pause button */}
      <View style={styles.timerRow}>
        <View style={[styles.timerBox, { borderColor: timeColor }]}>
          <Text style={[styles.timerText, { color: timeColor }]}>{timeDisplay}</Text>
        </View>
        <Pressable style={styles.pauseBtn} onPress={handlePause} hitSlop={8}>
          <PauseIcon size={20} />
        </Pressable>
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        <View style={styles.card}>
          <Text
            style={styles.targetWord}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {card.word}
          </Text>
          <View style={styles.divider} />
          <View style={styles.tabooList}>
            {card.tabooWords.map((w) => (
              <View key={w} style={styles.tabooWordRow}>
                <XIcon size={16} />
                <Text style={styles.tabooWord}>{w}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Taboo button — below card, for others to tap */}
      <View style={styles.tabooArea}>
        <Pressable
          style={({ pressed }) => [styles.tabooBtn, pressed && styles.tabooBtnPressed]}
          onPress={handleTaboo}
          disabled={isPaused}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <BanIcon size={24} />
            <Text style={styles.tabooBtnText}>TABOO!</Text>
          </View>
        </Pressable>
      </View>

      {/* Action buttons — cluegiver side */}
      <View style={styles.actionArea}>
        <Pressable
          style={({ pressed }) => [
            styles.passBtn,
            (!canPass || isPaused) && styles.passBtnDisabled,
            pressed && canPass && !isPaused && styles.passBtnPressed,
          ]}
          onPress={passAction}
          disabled={!canPass || isPaused}
        >
          <Text style={[styles.passBtnText, (!canPass || isPaused) && { opacity: 0.4 }]}>
            Skip ({passesLeft})
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.gotItBtn,
            isPaused && styles.gotItBtnDisabled,
            pressed && !isPaused && styles.gotItBtnPressed,
          ]}
          onPress={handleGotIt}
          disabled={isPaused}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <CheckIcon size={24} color={GAME_THEME.text} />
            <Text style={[styles.gotItBtnText, { color: GAME_THEME.text }]}>Got it!</Text>
          </View>
        </Pressable>
      </View>

      <BackButton onPress={() => setShowExitDialog(true)} color={GAME_THEME.accent} />
      {/* Pause overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseTitle}>Paused</Text>
          <Pressable
            style={[styles.resumeBtn, { backgroundColor: ACCENT }]}
            onPress={() => setIsPaused(false)}
          >
            <Text style={[styles.resumeBtnText, { color: GAME_THEME.text }]}>Resume</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  tabooArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: "center",
  },
  tabooBtn: {
    backgroundColor: palette.danger + "22",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: palette.danger,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: "center",
    width: "100%",
  },
  tabooBtnPressed: { backgroundColor: palette.danger + "44" },
  tabooBtnText: {
    fontSize: scaleFont(20),
    fontWeight: "900",
    color: palette.danger,
    letterSpacing: 1,
  },

  topBar: {
    alignItems: "center",
    paddingTop: 16,
    marginBottom: 12,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  livePoints: {
    fontSize: 14,
    color: GAME_THEME.accentLight,
    textAlign: "center",
    marginTop: 2,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  timerBox: {
    height: 52,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: ACCENT,
    lineHeight: 36,
    fontVariant: ["tabular-nums"],
  },
  pauseBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 2,
    borderColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },

  cardArea: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  card: {
    backgroundColor: GAME_THEME.accentMuted,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: ACCENT,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.lg,
  },
  targetWord: {
    fontSize: scaleFont(40),
    fontWeight: "900",
    color: ACCENT,
    textAlign: "center",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: spacing.sm,
  },
  tabooList: { gap: spacing.sm },
  tabooWordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tabooWord: {
    ...typography.bodyBold,
    color: palette.danger,
    flex: 1,
  },

  actionArea: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  passBtn: {
    flex: 1,
    backgroundColor: GAME_THEME.accentMuted,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: GAME_THEME.accentLight,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  passBtnDisabled: { opacity: 0.4 },
  passBtnPressed: { opacity: 0.7 },
  passBtnText: { ...typography.bodyBold, color: GAME_THEME.accentLight },

  gotItBtn: {
    flex: 2,
    backgroundColor: ACCENT,
    borderRadius: 18,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  gotItBtnDisabled: { opacity: 0.5 },
  gotItBtnPressed: { opacity: 0.8 },
  gotItBtnText: {
    fontSize: scaleFont(22),
    fontWeight: "900",
  },

  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GAME_THEME.accentDark + "F2",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xl,
    zIndex: 1000,
  },
  pauseTitle: {
    fontSize: scaleFont(52),
    fontWeight: "900",
    color: palette.white,
    letterSpacing: -1,
  },
  resumeBtn: {
    borderRadius: 20,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    minWidth: 200,
    alignItems: "center",
  },
  resumeBtnText: {
    fontSize: scaleFont(22),
    fontWeight: "900",
  },
});
