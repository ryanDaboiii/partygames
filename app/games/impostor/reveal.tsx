import React, { useState } from "react";
import { BackButton } from "../../../src/components/BackButton";
import { ExitGameDialog } from "../../../src/components/ExitGameDialog";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { HoldToReveal } from "../../../src/components/HoldToReveal";
import { GameButton } from "../../../src/components/GameButton";
import { palette, spacing, typography, shadows } from "../../../src/theme";
import { useImpostorStore } from "../../../src/games/impostor/gameStore";
import { getGameTheme } from "../../../src/games/registry";
import { CheckIcon } from "../../../src/assets/icons/CheckIcon";
import { CrewmateIcon } from "../../../src/assets/icons/CrewmateIcon";
import { ImpostorIcon } from "../../../src/assets/icons/ImpostorIcon";

const GAME_THEME = getGameTheme("impostor");
const ACCENT = GAME_THEME.accent;

export default function RevealScreen() {
  const router = useRouter();
  const assignments = useImpostorStore((s) => s.assignments);
  const revealIndex = useImpostorStore((s) => s.revealIndex);
  const advanceReveal = useImpostorStore((s) => s.advanceReveal);
  const startDiscussion = useImpostorStore((s) => s.startDiscussion);
  const reset = useImpostorStore((s) => s.reset);

  const [readyToPass, setReadyToPass] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const isLast = revealIndex === assignments.length - 1;
  const current = assignments[revealIndex];
  const next = assignments[revealIndex + 1];

  if (!current) return null;

  const isImpostor = current.role === "impostor";

  const handleNext = () => {
    setReadyToPass(false);
    if (isLast) {
      startDiscussion();
      router.replace("/games/impostor/discussion");
    } else {
      advanceReveal();
    }
  };

  const handleExitKeep = () => { reset(); router.replace('/hub'); };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
      <ExitGameDialog
        visible={showExitDialog}
        onKeepScores={handleExitKeep}
        onVoidPoints={handleExitKeep}
        onCancel={() => setShowExitDialog(false)}
      />
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {assignments.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < revealIndex && styles.dotDone,
                i === revealIndex && { backgroundColor: ACCENT },
              ]}
            />
          ))}
        </View>

        {readyToPass ? (
          <View style={styles.passPhase}>
            <CheckIcon size={64} />
            <Text style={styles.passTitle}>Word hidden</Text>
            <Text style={styles.passBody}>
              {isLast
                ? "Everyone has seen their word. Start the discussion!"
                : `Pass the phone to `}
              {!isLast && (
                <Text style={{ color: ACCENT }}>{next?.player.name}</Text>
              )}
            </Text>
            <GameButton
              label={
                isLast
                  ? "Start Discussion"
                  : `Pass to ${next?.player.name ?? ""} →`
              }
              onPress={handleNext}
              color={ACCENT}
              textColor={GAME_THEME.text}
              fullWidth
              style={styles.passBtn}
            />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.playerName}>
                <Text style={{ color: ACCENT }}>{current.player.name}</Text>
                , it's your turn
              </Text>
              <Text style={styles.playerHint}>
                Hold the button below — don't let anyone else see
              </Text>
            </View>

            <View style={styles.cardArea}>
              <HoldToReveal
                accentColor={ACCENT}
                onReveal={() => {}}
                onHide={() => setReadyToPass(true)}
              >
                {isImpostor ? <ImpostorCard /> : <CrewmateCard word={current.word!} />}
              </HoldToReveal>
            </View>

            <Text style={styles.footerHint}>
              After reading, tap "Tap to hide" to cover your word
            </Text>
          </>
        )}
      </View>
      <BackButton onPress={() => setShowExitDialog(true)} />
    </SafeAreaView>
  );
}

function CrewmateCard({ word }: { word: string }) {
  return (
    <View style={revealStyles.content}>
      <Text style={revealStyles.roleLabel}>You are a</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={revealStyles.role}>Crewmate</Text>
        <CrewmateIcon size={28} />
      </View>
      <View style={revealStyles.divider} />
      <Text style={revealStyles.wordLabel}>Secret word</Text>
      <Text style={revealStyles.word}>{word}</Text>
      <Text style={revealStyles.tip}>
        Give clues that prove you know the word — without being too obvious.
      </Text>
    </View>
  );
}

function ImpostorCard() {
  return (
    <View style={revealStyles.content}>
      <Text style={revealStyles.roleLabel}>You are the</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={[revealStyles.role, { color: ACCENT }]}>Impostor</Text>
        <ImpostorIcon size={28} />
      </View>
      <View style={revealStyles.divider} />
      <Text style={revealStyles.tip}>
        You have NO word. Listen to others' clues and bluff your way through!
      </Text>
    </View>
  );
}

const revealStyles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    backgroundColor: GAME_THEME.accentMuted,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: ACCENT,
    width: "100%",
  },
  roleLabel: { ...typography.caption, color: GAME_THEME.textMuted },
  role: { ...typography.heading1, color: GAME_THEME.accentLight },
  divider: { height: 1, backgroundColor: ACCENT + "44", width: "60%", marginVertical: spacing.sm },
  wordLabel: { ...typography.label, color: GAME_THEME.textMuted },
  word: { ...typography.display, color: palette.white, textAlign: "center" },
  tip: { ...typography.caption, color: GAME_THEME.textMuted, textAlign: "center", marginTop: spacing.sm },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: spacing.lg },
  dots: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.border },
  dotDone: { backgroundColor: palette.success },

  header: { marginBottom: spacing.xl, alignItems: "center" },
  playerName: { ...typography.heading2, color: palette.white, textAlign: "center" },
  playerHint: {
    ...typography.caption,
    color: palette.muted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  cardArea: { flex: 1, justifyContent: "center" },
  footerHint: {
    ...typography.caption,
    color: palette.border,
    textAlign: "center",
    marginTop: spacing.md,
  },

  passPhase: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  passTitle: { ...typography.heading1, color: palette.white },
  passBody: { ...typography.body, color: palette.muted, textAlign: "center" },
  passBtn: { marginTop: spacing.md, width: "100%" },
});
