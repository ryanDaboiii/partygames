import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { HoldToReveal } from "../../../src/components/HoldToReveal";
import { Button } from "../../../src/components/Button";
import { palette, spacing, typography } from "../../../src/theme";
import { useImpostorStore } from "../../../src/games/impostor/gameStore";

const ACCENT = palette.impostor;

export default function RevealScreen() {
  const router = useRouter();
  const assignments = useImpostorStore((s) => s.assignments);
  const revealIndex = useImpostorStore((s) => s.revealIndex);
  const advanceReveal = useImpostorStore((s) => s.advanceReveal);
  const startDiscussion = useImpostorStore((s) => s.startDiscussion);

  // true once the player has revealed AND hidden the card
  const [readyToPass, setReadyToPass] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe}>
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
          // — Phase 2: word is hidden, safe to pass —
          <View style={styles.passPhase}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.passTitle}>Word hidden</Text>
            <Text style={styles.passBody}>
              {isLast
                ? "Everyone has seen their word. Start the discussion!"
                : `Pass the phone to `}
              {!isLast && (
                <Text style={{ color: ACCENT }}>{next?.player.name}</Text>
              )}
            </Text>
            <Button
              label={
                isLast
                  ? "Start Discussion"
                  : `Pass to ${next?.player.name ?? ""} →`
              }
              onPress={handleNext}
              accentColor={ACCENT}
              fullWidth
              style={styles.passBtn}
            />
          </View>
        ) : (
          // — Phase 1: current player reveals their word —
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
                onReveal={() => {/* word now visible */}}
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
    </SafeAreaView>
  );
}

function CrewmateCard({ word }: { word: string }) {
  return (
    <View style={revealStyles.content}>
      <Text style={revealStyles.roleLabel}>You are a</Text>
      <Text style={revealStyles.role}>Crewmate 👥</Text>
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
      <Text style={[revealStyles.role, { color: palette.impostor }]}>Impostor 🕵️</Text>
      <View style={revealStyles.divider} />
      <Text style={revealStyles.tip}>
        You have NO word. Listen to others' clues and bluff your way through!
      </Text>
    </View>
  );
}

const revealStyles = StyleSheet.create({
  content: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  roleLabel: { ...typography.caption, color: palette.muted },
  role: { ...typography.heading1, color: palette.white },
  divider: { height: 1, backgroundColor: palette.border, width: "60%", marginVertical: spacing.sm },
  wordLabel: { ...typography.label, color: palette.muted },
  word: { ...typography.display, color: palette.white },
  tip: { ...typography.caption, color: palette.muted, textAlign: "center", marginTop: spacing.sm },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, padding: spacing.lg },
  dots: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.border },
  dotDone: { backgroundColor: palette.success },

  // Phase 1
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

  // Phase 2
  passPhase: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  checkmark: {
    fontSize: 64,
    color: palette.success,
  },
  passTitle: { ...typography.heading1, color: palette.white },
  passBody: { ...typography.body, color: palette.muted, textAlign: "center" },
  passBtn: { marginTop: spacing.md, width: "100%" },
});
