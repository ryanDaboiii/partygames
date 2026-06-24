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
import { GameButton } from "../../../src/components/GameButton";
import { HoldToReveal } from "../../../src/components/HoldToReveal";
import { palette, spacing, typography, scaleFont, shadows } from "../../../src/theme";
import { useWavelengthStore } from "../../../src/games/wavelength/store";
import { CATEGORIES } from "../../../src/games/wavelength/categories";
import { getGameTheme } from "../../../src/games/registry";
import type { Category } from "../../../src/games/wavelength/categories";
import { EyesClosedIcon } from "../../../src/assets/icons/EyesClosedIcon";
import { TargetIcon } from "../../../src/assets/icons/TargetIcon";
import { CategorySwitchIcon } from "../../../src/assets/icons/CategorySwitchIcon";
import { CheckIcon } from "../../../src/assets/icons/CheckIcon";
import { XIcon } from "../../../src/assets/icons/XIcon";
import { ArrowLeftIcon } from "../../../src/assets/icons/ArrowLeftIcon";
import { playSfx } from "../../../src/hooks/useSoundEffects";
import { BackButton } from "../../../src/components/BackButton";
import { ExitGameDialog } from "../../../src/components/ExitGameDialog";
import { usePlayerStore } from "../../../src/store/players";
import { useSessionStore } from "../../../src/store/session";
import { clearSessionCurrentGame } from "../../../src/firebase/sessions";

const GAME_THEME = getGameTheme("wavelength");
const ACCENT = GAME_THEME.accent;
const MAX_SWITCHES = 3;

type LocalPhase =
  | "guesser-select"
  | "guesser-looks-away"
  | "single-reveal"
  | "clue-turn"
  | "guesser-announces"
  | "extra-clue"
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
  const recordExtraClueCategory = useWavelengthStore((s) => s.recordExtraClueCategory);
  const submitResult = useWavelengthStore((s) => s.submitResult);
  const pointsAwardedThisGame = useWavelengthStore((s) => s.pointsAwardedThisGame);
  const reset = useWavelengthStore((s) => s.reset);
  const addPoints = usePlayerStore((s) => s.addPoints);

  const mode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const isHost = useSessionStore((s) => s.isHost);

  const [showExitDialog, setShowExitDialog] = useState(false);

  const defaultGuesserIndex = (roundNumber - 1) % players.length;
  const [selectedGuesserIndex, setSelectedGuesserIndex] = useState(defaultGuesserIndex);
  const categoryStyle = useWavelengthStore((s) => s.categoryStyle);
  const [localPhase, setLocalPhase] = useState<LocalPhase>("guesser-select");
  const [cardRevealed, setCardRevealed] = useState(false);
  const [clueIndex, setClueIndex] = useState(0);
  const [extraClueEntry, setExtraClueEntry] = useState<{ player: { id: string; name: string }; category: Category } | null>(null);

  const displayCategory = (cat: Category) => categoryStyle === "simple" ? cat.name : cat.label;

  const handleExitKeep = async () => {
    if (mode === "online" && isHost && sessionCode) {
      try { await clearSessionCurrentGame(sessionCode); } catch (_) {}
    }
    reset();
    router.replace('/hub');
  };
  const handleExitVoid = async () => {
    Object.entries(pointsAwardedThisGame).forEach(([id, pts]) => {
      if (pts > 0) addPoints(id, -pts);
    });
    if (mode === "online" && isHost && sessionCode) {
      try { await clearSessionCurrentGame(sessionCode); } catch (_) {}
    }
    reset();
    router.replace('/hub');
  };
  const exitDialog = (
    <ExitGameDialog
      visible={showExitDialog}
      onKeepScores={handleExitKeep}
      onVoidPoints={handleExitVoid}
      onCancel={() => setShowExitDialog(false)}
    />
  );
  const backBtn = <BackButton onPress={() => setShowExitDialog(true)} color={GAME_THEME.accent} />;

  const revealScale = useRef(new Animated.Value(0.3)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === "game-over") {
      router.replace("/games/wavelength/scoreboard");
    }
  }, [phase]);

  useEffect(() => {
    setSelectedGuesserIndex((roundNumber - 1) % players.length);
    setLocalPhase("guesser-select");
    setCardRevealed(false);
    setClueIndex(0);
    setExtraClueEntry(null);
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
    playSfx(correct ? "fanfare" : "wrong");
    submitResult(correct);
  };

  const handleRequestExtraClue = () => {
    if (!currentRound) return;
    const allUsedIds = new Set([
      ...currentRound.usedCategoryIds,
      ...currentRound.extraClueUsedCategoryIds,
    ]);
    const available = CATEGORIES.filter((c) => !allUsedIds.has(c.id));
    const pool = available.length > 0 ? available : CATEGORIES;
    const newCat = pool[Math.floor(Math.random() * pool.length)];
    recordExtraClueCategory(newCat.id);
    const nonGuessers = currentRound.playerCategories;
    const entry = nonGuessers[Math.floor(Math.random() * nonGuessers.length)];
    setExtraClueEntry({ player: entry.player, category: newCat });
    setLocalPhase("extra-clue");
  };

  const cycleNumber = players.length > 0
    ? Math.ceil(roundNumber / players.length)
    : roundNumber;

  // ─── PHASE: GUESSER SELECT ──────────────────────────────────────────────

  if (localPhase === "guesser-select") {
    const guesser = players[selectedGuesserIndex];
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        {exitDialog}
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <RoundBadge round={cycleNumber} total={totalRounds} />

          <View style={styles.centerBlock}>
            <EyesClosedIcon size={64} style={{ marginBottom: spacing.sm }} />
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

          <GameButton
            label="Guesser, look away →"
            onPress={handleConfirmGuesser}
            color={ACCENT}
            textColor={GAME_THEME.text}
            fullWidth
          />
        </ScrollView>
        {backBtn}
      </SafeAreaView>
    );
  }

  // ─── PHASE: GUESSER LOOKS AWAY ───────────────────────────────────────────

  if (localPhase === "guesser-looks-away" && currentRound) {
    const guesserName = players[currentRound.guesserIndex]?.name ?? "Guesser";
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        {exitDialog}
        <View style={styles.page}>
          <RoundBadge round={cycleNumber} total={totalRounds} />
          <View style={styles.centerBlock}>
            <EyesClosedIcon size={64} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.guesserAnnounce}>Guesser</Text>
            <Text style={[styles.guesserName, { color: ACCENT }]}>{guesserName}</Text>
            <Text style={[styles.passHint, { textAlign: "center", marginTop: spacing.sm }]}>
              close your eyes or look away!
            </Text>
          </View>
          <GameButton
            label="Ready — Guesser can't see"
            onPress={handleGuesserLookedAway}
            color={ACCENT}
            textColor={GAME_THEME.text}
            fullWidth
          />
        </View>
        {backBtn}
      </SafeAreaView>
    );
  }

  // ─── PHASE: SINGLE REVEAL ────────────────────────────────────────────────

  if (localPhase === "single-reveal" && currentRound) {
    const nonGuessers = currentRound.playerCategories;
    const categorySwitches = currentRound.categorySwitches;

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        {exitDialog}
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
                            {displayCategory(category)}
                          </Text>
                          <Pressable
                            style={[
                              styles.switchBtn,
                              switchesLeft <= 0 && styles.switchBtnDisabled,
                            ]}
                            onPress={() => switchCategory(catIndex)}
                            disabled={switchesLeft <= 0}
                          >
                            {switchesLeft > 0 ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                <CategorySwitchIcon size={11} />
                                <Text style={styles.switchBtnText}>
                                  New category ({switchesLeft} left)
                                </Text>
                              </View>
                            ) : (
                              <Text style={[styles.switchBtnText, styles.switchBtnTextDisabled]}>
                                No more switches
                              </Text>
                            )}
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
            <GameButton
              label="Done — Guesser, come back!"
              onPress={handleSingleRevealDone}
              color={ACCENT}
              textColor={GAME_THEME.text}
              fullWidth
            />
          )}
        </View>
        {backBtn}
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
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        {exitDialog}
        <View style={styles.page}>
          <View style={styles.topRow}>
            <Pressable style={styles.backBtn} onPress={handleClueBack} hitSlop={12}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ArrowLeftIcon size={16} />
                <Text style={styles.backBtnText}>Back</Text>
              </View>
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
            <Text style={[styles.clueTurnCategory, { color: ACCENT }]}>{displayCategory(current.category)}</Text>
          </View>

          <GameButton
            label={isLast ? "Done — all clues given →" : "Done — next player →"}
            onPress={handleClueNext}
            color={ACCENT}
            textColor={GAME_THEME.text}
            fullWidth
          />
        </View>
        {backBtn}
      </SafeAreaView>
    );
  }

  // ─── PHASE: GUESSER ANNOUNCES ────────────────────────────────────────────

  if (localPhase === "guesser-announces" && currentRound) {
    const guesserName = players[currentRound.guesserIndex]?.name ?? "Guesser";
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        {exitDialog}
        <View style={styles.page}>
          <RoundBadge round={cycleNumber} total={totalRounds} />

          <View style={styles.centerBlock}>
            <TargetIcon size={64} style={{ marginBottom: spacing.sm }} />
            <Text style={[styles.guesserName, { color: ACCENT }]}>{guesserName}</Text>
            <Text style={styles.guesserAnnounce}>tell everyone your guess!</Text>
          </View>

          <GameButton
            label="Reveal the answer →"
            onPress={handleRevealAnswer}
            color={ACCENT}
            textColor={GAME_THEME.text}
            fullWidth
          />
          <Pressable style={styles.extraClueBtn} onPress={handleRequestExtraClue}>
            <Text style={styles.extraClueBtnText}>Need one more clue?</Text>
          </Pressable>
        </View>
        {backBtn}
      </SafeAreaView>
    );
  }

  // ─── PHASE: EXTRA CLUE ───────────────────────────────────────────────────

  if (localPhase === "extra-clue" && currentRound && extraClueEntry) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        {exitDialog}
        <View style={styles.page}>
          <RoundBadge round={cycleNumber} total={totalRounds} />

          <View>
            <Text style={styles.sectionTitle}>Extra Clue</Text>
            <Text style={styles.sectionSub}>One more before the guess!</Text>
          </View>

          <View style={styles.centerBlock}>
            <Text style={styles.clueTurnName}>{extraClueEntry.player.name}</Text>
            <Text style={[styles.clueTurnCategory, { color: ACCENT }]}>{displayCategory(extraClueEntry.category)}</Text>
          </View>

          <GameButton
            label="Done — back to guesser →"
            onPress={() => setLocalPhase("guesser-announces")}
            color={ACCENT}
            textColor={GAME_THEME.text}
            fullWidth
          />
        </View>
        {backBtn}
      </SafeAreaView>
    );
  }

  // ─── PHASE: OUTCOME ──────────────────────────────────────────────────────

  if (localPhase === "outcome" && currentRound) {
    const guesserName = players[currentRound.guesserIndex]?.name ?? "Guesser";
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        {exitDialog}
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
              <CheckIcon size={36} />
              <Text style={styles.outcomeBtnText}>Got it!</Text>
            </Pressable>
            <Pressable
              style={[styles.outcomeBtn, styles.outcomeBtnWrong]}
              onPress={() => handleRecordResult(false)}
            >
              <XIcon size={36} />
              <Text style={styles.outcomeBtnText}>Wrong</Text>
            </Pressable>
          </View>
        </View>
        {backBtn}
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
  safe: { flex: 1 },
  page: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: 106,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    justifyContent: "space-between",
  },

  centerBlock: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.sm },
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
    ...shadows.sm,
  },
  playerChipText: { ...typography.bodyBold, color: palette.muted },

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
    ...shadows.sm,
  },
  revealAllName: { ...typography.bodyBold, color: palette.white, paddingTop: 2 },
  revealAllRight: {
    flex: 1,
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  revealAllCategory: { ...typography.bodyBold, textAlign: "right", flexShrink: 1 },

  switchBtn: {
    backgroundColor: GAME_THEME.accentMuted,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: ACCENT,
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

  sectionTitle: { ...typography.heading2, color: palette.white },
  sectionSub: { ...typography.caption, color: palette.muted, marginTop: 4, lineHeight: 18 },
  clueTurnLabel: { ...typography.label, color: palette.muted, marginBottom: spacing.sm },
  clueTurnName: { ...typography.display, color: palette.white },
  clueTurnCategory: { ...typography.heading2, marginTop: spacing.md },

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
    ...shadows.sm,
  },
  outcomeBtnCorrect: { borderColor: palette.success },
  outcomeBtnWrong: { borderColor: palette.danger },
  outcomeBtnText: { ...typography.bodyBold, color: palette.white },

  extraClueBtn: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  extraClueBtnText: {
    ...typography.caption,
    color: ACCENT,
  },

  section: { gap: spacing.sm },
  sectionLabel: { ...typography.label, color: palette.muted },

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
