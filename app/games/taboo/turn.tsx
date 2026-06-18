import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { palette, spacing, typography } from "../../../src/theme";
import { useTabooStore, getCurrentCluegiver } from "../../../src/games/taboo/store";
import { usePlayerStore } from "../../../src/store/players";
import { MAX_PASSES_PER_TURN } from "../../../src/games/taboo/logic";

const ACCENT = palette.taboo;

export default function TurnScreen() {
  const router = useRouter();

  const phase = useTabooStore((s) => s.phase);
  const deck = useTabooStore((s) => s.deck);
  const cardIndex = useTabooStore((s) => s.cardIndex);
  const roundTimeSecs = useTabooStore((s) => s.roundTimeSecs);
  const passesUsed = useTabooStore((s) => s.passesUsed);
  const totalTurnsPlayed = useTabooStore((s) => s.totalTurnsPlayed);
  const players = useTabooStore((s) => s.players);
  const gamePoints = useTabooStore((s) => s.gamePoints);
  const turnNetScore = useTabooStore((s) => s.turnNetScore);
  const gotItAction = useTabooStore((s) => s.gotIt);
  const passAction = useTabooStore((s) => s.pass);
  const tabooAction = useTabooStore((s) => s.taboo);
  const endTurn = useTabooStore((s) => s.endTurn);

  const localPlayers = usePlayerStore((s) => s.players);
  const addPoints = usePlayerStore((s) => s.addPoints);

  const [timeLeft, setTimeLeft] = useState(roundTimeSecs);

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

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) endTurn();
  }, [timeLeft]);

  const handleGotIt = () => {
    gotItAction();
  };

  const timeColor =
    timeLeft <= 10 ? palette.danger : timeLeft <= 20 ? palette.warning : ACCENT;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeDisplay = mins > 0
    ? `${mins}:${secs.toString().padStart(2, "0")}`
    : `0:${secs.toString().padStart(2, "0")}`;

  const passesLeft = MAX_PASSES_PER_TURN - passesUsed;
  const canPass = passesLeft > 0;

  if (!card) return null;

  const liveScore = gamePoints[cluegiver] ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Timer + player info */}
      <View style={styles.statusStrip}>
        <View style={[styles.timerBadge, { borderColor: timeColor }]}>
          <Text style={[styles.timerText, { color: timeColor }]}>{timeDisplay}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerNameText}>{cluegiver}</Text>
          <Text style={styles.scoreText}>{liveScore} pts</Text>
        </View>
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        <View style={styles.card}>
          <Text style={styles.targetWord}>{card.word}</Text>
          <View style={styles.divider} />
          <View style={styles.tabooList}>
            {card.tabooWords.map((w) => (
              <View key={w} style={styles.tabooWordRow}>
                <Text style={styles.tabooWordIcon}>✗</Text>
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
          onPress={tabooAction}
        >
          <Text style={styles.tabooBtnText}>🚫 TABOO!</Text>
        </Pressable>
      </View>

      {/* Action buttons — cluegiver side */}
      <View style={styles.actionArea}>
        <Pressable
          style={({ pressed }) => [
            styles.passBtn,
            !canPass && styles.passBtnDisabled,
            pressed && canPass && styles.passBtnPressed,
          ]}
          onPress={passAction}
          disabled={!canPass}
        >
          <Text style={[styles.passBtnText, !canPass && { color: palette.border }]}>
            Skip ({passesLeft})
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.gotItBtn, pressed && styles.gotItBtnPressed]}
          onPress={handleGotIt}
        >
          <Text style={styles.gotItBtnText}>✓ Got it!</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },

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
    fontSize: 20,
    fontWeight: "900",
    color: palette.danger,
    letterSpacing: 1,
  },

  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  timerBadge: {
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: 80,
    alignItems: "center",
  },
  timerText: {
    fontSize: 28,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  playerInfo: { alignItems: "flex-end", gap: 2 },
  playerNameText: { ...typography.label, color: palette.muted },
  scoreText: { ...typography.heading2, color: ACCENT },

  cardArea: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  targetWord: {
    fontSize: 40,
    fontWeight: "900",
    color: palette.white,
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
  tabooWordIcon: {
    fontSize: 16,
    color: palette.danger,
    fontWeight: "700",
    width: 20,
    textAlign: "center",
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
    backgroundColor: palette.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.border,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  passBtnDisabled: { opacity: 0.4 },
  passBtnPressed: { backgroundColor: palette.border + "44" },
  passBtnText: { ...typography.bodyBold, color: palette.muted },

  gotItBtn: {
    flex: 2,
    backgroundColor: ACCENT,
    borderRadius: 18,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  gotItBtnPressed: { opacity: 0.8 },
  gotItBtnText: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.white,
  },
});
