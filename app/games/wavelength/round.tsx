import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Animated,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../src/components/Button";
import { HoldToReveal } from "../../../src/components/HoldToReveal";
import { palette, spacing, typography, scaleFont } from "../../../src/theme";
import { useWavelengthStore } from "../../../src/games/wavelength/store";

const ACCENT = palette.wavelength;
const MAX_SWITCHES = 3;

type LocalPhase =
  | "guesser-select"
  | "guesser-looks-away"
  | "single-reveal"
  | "clue-turn"
  | "guesser-announces"
  | "outcome";

export default function RoundScreen() {
  const router = useRouter();

  const phase = useWavelengthStore((s) => s.phase);
  const players = useWavelengthStore((s) => s.players);
  const maxNumber = useWavelengthStore((s) => s.maxNumber);
  const roundNumber = useWavelengthStore((s) => s.roundNumber);
  const totalRounds = useWavelengthStore((s) => s.totalRounds);
  const currentRound = useWavelengthStore((s) => s.currentRound);
  const startRound = useWavelengthStore((s) => s.startRound);
  const switchCategory = useWavelengthStore((s) => s.switchCategory);
  const submitResult = useWavelengthStore((s) => s.submitResult);

  // Guesser cycles through players in round order; host can override by tapping
  const defaultGuesserIndex = (roundNumber - 1) % players.length;
  const [selectedGuesserIndex, setSelectedGuesserIndex] = useState(defaultGuesserIndex);
  const [localPhase, setLocalPhase] = useState<LocalPhase>("guesser-select");
  const [cardRevealed, setCardRevealed] = useState(false);
  const [clueIndex, setClueIndex] = useState(0);

  // Reveal animation for the secret number
  const revealScale = useRef(new Animated.Value(0.3)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === "game-over") {
      router.replace("/games/wavelength/scoreboard");
    }
  }, [phase]);

  // Reset local state when round number changes (i.e. after submitResult)
  useEffect(() => {
    setSelectedGuesserIndex((roundNumber - 1) % players.length);
    setLocalPhase("guesser-select");
    setCardRevealed(false);
    setClueIndex(0);
    revealScale.setValue(0.3);
    revealOpacity.setValue(0);
  }, [roundNumber]);

  const handleConfirmGuesser = () => {
    startRound(selectedGuesserIndex);
    setLocalPhase("guesser-looks-away");
  };

  const handleGuesserLookedAway = () => {
    setCardRevealed(false);
    setLocalPhase("single-reveal");
  };

  const handleSingleRevealDone = () => {
    setCardRevealed(false);
    setClueIndex(0);
    setLocalPhase("clue-turn");
  };

  const handleClueNext = () => {
    const nonGuessers = currentRound!.playerCategories;
    if (clueIndex < nonGuessers.length - 1) {
      setClueIndex((i) => i + 1);
    } else {
      setLocalPhase("guesser-announces");
    }
  };

  const handleRevealAnswer = () => {
    Animated.parallel([
      Animated.spring(revealScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(revealOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setLocalPhase("outcome");
  };

  const handleRecordResult = (correct: boolean) => {
    submitResult(correct);
    // roundNumber (or phase) will change → useEffect resets local state / redirects
  };

  // Fix 7: show which full cycle we're in, not the raw turn number
  const cycleNumber = players.length > 0
    ? Math.ceil(roundNumber / players.length)
    : roundNumber;

  // ─── PHASE: GUESSER SELECT ──────────────────────────────────────────────

  if (localPhase === "guesser-select") {
    const guesser = players[selectedGuesserIndex];
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <RoundBadge round={cycleNumber} total={totalRounds} />

          <View style={styles.centerBlock}>
            <Text style={styles.guesserEmoji}>🙈</Text>
            <Text style={styles.guesserAnnounce}>This round's Guesser is</Text>
            <Text style={[styles.guesserName, { color: ACCENT }]}>{guesser?.name}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tap to change</Text>
            <View style={styles.playerGrid}>
              {players.map((p, i) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.playerChip,
                    i === selectedGuesserIndex && { borderColor: ACCENT, backgroundColor: ACCENT + "22" },
                  ]}
                  onPress={() => setSelectedGuesserIndex(i)}
                >
                  <Text style={[styles.playerChipText, i === selectedGuesserIndex && { color: ACCENT }]}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button
            label="Guesser, look away →"
            onPress={handleConfirmGuesser}
            accentColor={ACCENT}
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── PHASE: GUESSER LOOKS AWAY ───────────────────────────────────────────

  if (localPhase === "guesser-looks-away" && currentRound) {
    const guesserName = players[currentRound.guesserIndex]?.name ?? "Guesser";
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.page}>
          <RoundBadge round={cycleNumber} total={totalRounds} />
          <View style={styles.centerBlock}>
            <Text style={styles.guesserEmoji}>🙈</Text>
            <Text style={styles.guesserAnnounce}>Guesser</Text>
            <Text style={[styles.guesserName, { color: ACCENT }]}>{guesserName}</Text>
            <Text style={[styles.passHint, { textAlign: "center", marginTop: spacing.sm }]}>
              close your eyes or look away!
            </Text>
          </View>
          <Button
            label="Ready — Guesser can't see"
            onPress={handleGuesserLookedAway}
            accentColor={ACCENT}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── PHASE: SINGLE REVEAL ────────────────────────────────────────────────

  if (localPhase === "single-reveal" && currentRound) {
    const nonGuessers = currentRound.playerCategories;
    const categorySwitches = currentRound.categorySwitches;

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.page}>
          <RoundBadge round={cycleNumber} total={totalRounds} />

          <Text style={styles.passPrompt}>Everyone except the Guesser, look together</Text>
          <Text style={styles.passHint}>Hold to reveal the number and your categories</Text>

          <View style={styles.holdArea}>
            <HoldToReveal
              holdLabel="Hold to reveal"
              accentColor={ACCENT}
              holdDuration={700}
              onReveal={() => setCardRevealed(true)}
            >
              <View style={styles.revealAllCard}>
                <Text style={styles.categoryCardLabel}>The number is</Text>
                <Text style={[styles.categoryCardNumber, { color: ACCENT }]}>
                  {currentRound.secretNumber}
                </Text>
                <Text style={styles.categoryCardOf}>out of {maxNumber}</Text>
                <View style={styles.cardDivider} />
                <View style={styles.revealAllList}>
                  {nonGuessers.map(({ player, category }, catIndex) => {
                    const switchesUsed = categorySwitches[player.id] ?? 0;
                    const switchesLeft = MAX_SWITCHES - switchesUsed;
                    return (
                      <View key={player.id} style={styles.revealAllRow}>
                        <Text style={styles.revealAllName}>{player.name}</Text>
                        <View style={styles.revealAllRight}>
                          <Text style={[styles.revealAllCategory, { color: ACCENT }]}>
                            {category.name}
                          </Text>
                          <Pressable
                            style={[
                              styles.switchBtn,
                              switchesLeft <= 0 && styles.switchBtnDisabled,
                            ]}
                            onPress={() => switchCategory(catIndex)}
                            disabled={switchesLeft <= 0}
                          >
                            <Text style={[
                              styles.switchBtnText,
                              switchesLeft <= 0 && styles.switchBtnTextDisabled,
                            ]}>
                              {switchesLeft > 0
                                ? `↻ New category (${switchesLeft} left)`
                                : "No more switches"}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </HoldToReveal>
          </View>

          {cardRevealed && (
            <Button
              label="Done — Guesser, come back!"
              onPress={handleSingleRevealDone}
              accentColor={ACCENT}
              fullWidth
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── PHASE: CLUE TURN ────────────────────────────────────────────────────

  if (localPhase === "clue-turn" && currentRound) {
    const nonGuessers = currentRound.playerCategories;
    const current = nonGuessers[clueIndex];
    const isLast = clueIndex === nonGuessers.length - 1;
    const guesserName = players[currentRound.guesserIndex]?.name ?? "Guesser";

    const handleClueBack = () => {
      if (clueIndex > 0) {
        setClueIndex((i) => i - 1);
      } else {
        setCardRevealed(false);
        setLocalPhase("single-reveal");
      }
    };

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.page}>
          <View style={styles.topRow}>
            <Pressable style={styles.backBtn} onPress={handleClueBack} hitSlop={12}>
              <Text style={styles.backBtnText}>‹ Back</Text>
            </Pressable>
            <RoundBadge round={cycleNumber} total={totalRounds} />
          </View>

          <View>
            <Text style={styles.sectionTitle}>Clue Phase</Text>
            <Text style={styles.sectionSub}>
              {guesserName}, listen carefully!
            </Text>
          </View>

          <View style={styles.centerBlock}>
            <Text style={styles.clueTurnLabel}>
              Clue {clueIndex + 1} of {nonGuessers.length}
            </Text>
            <Text style={styles.clueTurnName}>{current.player.name}</Text>
            <Text style={[styles.clueTurnCategory, { color: ACCENT }]}>{current.category.name}</Text>
          </View>

          <Button
            label={isLast ? "Done — all clues given →" : "Done — next player →"}
            onPress={handleClueNext}
            accentColor={ACCENT}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── PHASE: GUESSER ANNOUNCES ────────────────────────────────────────────

  if (localPhase === "guesser-announces" && currentRound) {
    const guesserName = players[currentRound.guesserIndex]?.name ?? "Guesser";
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.page}>
          <RoundBadge round={cycleNumber} total={totalRounds} />

          <View style={styles.centerBlock}>
            <Text style={styles.guesserEmoji}>🎯</Text>
            <Text style={[styles.guesserName, { color: ACCENT }]}>{guesserName}</Text>
            <Text style={styles.guesserAnnounce}>tell everyone your guess!</Text>
          </View>

          <Button
            label="Reveal the answer →"
            onPress={handleRevealAnswer}
            accentColor={ACCENT}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── PHASE: OUTCOME ──────────────────────────────────────────────────────

  if (localPhase === "outcome" && currentRound) {
    const guesserName = players[currentRound.guesserIndex]?.name ?? "Guesser";
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.page}>
          <RoundBadge round={cycleNumber} total={totalRounds} />

          <View style={styles.revealBlock}>
            <Text style={styles.revealLabel}>The secret number was</Text>
            <Animated.Text
              style={[
                styles.revealNumber,
                { color: ACCENT, transform: [{ scale: revealScale }], opacity: revealOpacity },
              ]}
            >
              {currentRound.secretNumber}
            </Animated.Text>
            <Text style={styles.revealGuessLine}>Did {guesserName} get it right?</Text>
          </View>

          <View style={styles.outcomeBtnRow}>
            <Pressable
              style={[styles.outcomeBtn, styles.outcomeBtnCorrect]}
              onPress={() => handleRecordResult(true)}
            >
              <Text style={styles.outcomeBtnEmoji}>✅</Text>
              <Text style={styles.outcomeBtnText}>Got it!</Text>
            </Pressable>
            <Pressable
              style={[styles.outcomeBtn, styles.outcomeBtnWrong]}
              onPress={() => handleRecordResult(false)}
            >
              <Text style={styles.outcomeBtnEmoji}>❌</Text>
              <Text style={styles.outcomeBtnText}>Wrong</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────

function RoundBadge({ round, total }: { round: number; total: number }) {
  return (
    <View style={rbStyles.badge}>
      <Text style={rbStyles.text}>Round {round} of {total}</Text>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  page: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    justifyContent: "space-between",
  },

  // Guesser select
  centerBlock: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.sm },
  guesserEmoji: { fontSize: scaleFont(64), marginBottom: spacing.sm },
  guesserAnnounce: { ...typography.body, color: palette.muted },
  guesserName: { ...typography.display },
  playerGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  playerChip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.bgCard,
  },
  playerChipText: { ...typography.bodyBold, color: palette.muted },

  // Single reveal
  passPrompt: { ...typography.heading2, color: palette.white, textAlign: "center" },
  passHint: { ...typography.caption, color: palette.muted, textAlign: "center" },
  holdArea: { flex: 1, justifyContent: "center" },
  categoryCardLabel: { ...typography.caption, color: palette.muted },
  categoryCardNumber: { ...typography.display },
  categoryCardOf: { ...typography.bodyBold, color: palette.muted },
  cardDivider: { width: 48, height: 1.5, backgroundColor: palette.border, marginVertical: spacing.sm },
  revealAllCard: { width: "100%", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  revealAllList: { width: "100%", gap: spacing.md, marginTop: spacing.sm },
  revealAllRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  revealAllName: { ...typography.bodyBold, color: palette.white, paddingTop: 2 },
  revealAllRight: {
    flex: 1,
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  revealAllCategory: { ...typography.bodyBold, textAlign: "right", flexShrink: 1 },

  // Category switch button
  switchBtn: {
    backgroundColor: ACCENT + "18",
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: ACCENT + "55",
  },
  switchBtnDisabled: {
    borderColor: palette.border,
    backgroundColor: palette.bgCard,
    opacity: 0.55,
  },
  switchBtnText: {
    fontSize: scaleFont(11),
    fontWeight: "600",
    color: ACCENT,
  },
  switchBtnTextDisabled: {
    color: palette.muted,
  },

  // Clue turn
  sectionTitle: { ...typography.heading2, color: palette.white },
  sectionSub: { ...typography.caption, color: palette.muted, marginTop: 4, lineHeight: 18 },
  clueTurnLabel: { ...typography.label, color: palette.muted, marginBottom: spacing.sm },
  clueTurnName: { ...typography.display, color: palette.white },
  clueTurnCategory: { ...typography.heading2, marginTop: spacing.md },

  // Outcome phase
  revealBlock: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
  revealLabel: { ...typography.body, color: palette.muted },
  revealNumber: { fontSize: scaleFont(96), fontWeight: "900" as const, letterSpacing: -3, lineHeight: scaleFont(108) },
  revealGuessLine: { ...typography.caption, color: palette.muted, marginTop: spacing.xs },
  outcomeBtnRow: { flexDirection: "row", gap: spacing.md },
  outcomeBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: palette.bgCard,
  },
  outcomeBtnCorrect: { borderColor: palette.success },
  outcomeBtnWrong: { borderColor: palette.danger },
  outcomeBtnEmoji: { fontSize: scaleFont(36) },
  outcomeBtnText: { ...typography.bodyBold, color: palette.white },

  // Shared
  section: { gap: spacing.sm },
  sectionLabel: { ...typography.label, color: palette.muted },

  // Clue-turn back navigation
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { paddingVertical: spacing.xs, paddingRight: spacing.md },
  backBtnText: { ...typography.bodyBold, color: palette.muted },
});

const rbStyles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: ACCENT + "22",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: { ...typography.label, color: ACCENT },
});
