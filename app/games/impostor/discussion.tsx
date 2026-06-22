import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../src/components/Button";
import { Timer } from "../../../src/components/Timer";
import { palette, spacing, typography } from "../../../src/theme";
import { useImpostorStore } from "../../../src/games/impostor/gameStore";
import { usePlayerStore } from "../../../src/store/players";
import { useSessionStore } from "../../../src/store/session";

const ACCENT = palette.impostor;

export default function DiscussionScreen() {
  const router = useRouter();
  const assignments = useImpostorStore((s) => s.assignments);
  const secretWord = useImpostorStore((s) => s.secretWord);
  const speakingOrder = useImpostorStore((s) => s.speakingOrder);
  const reset = useImpostorStore((s) => s.reset);
  const addPoints = usePlayerStore((s) => s.addPoints);
  const scoringMode = useSessionStore((s) => s.scoringMode);

  const [showTimer, setShowTimer] = useState(false);
  const [winnerSelection, setWinnerSelection] = useState<string | null>(null);
  const [wordRevealed, setWordRevealed] = useState(false);

  const impostors = assignments.filter((a) => a.role === "impostor");
  const crewmates = assignments.filter((a) => a.role === "crewmate");

  const handleAwardCrewmates = () => {
    if (winnerSelection) return;
    const pts = scoringMode === "extended" ? 3 : 1;
    crewmates.forEach((a) => addPoints(a.player.id, pts));
    setWinnerSelection("Crewmates");
  };

  const handleAwardImpostors = () => {
    if (winnerSelection) return;
    const pts = scoringMode === "extended" ? 4 : 1;
    impostors.forEach((a) => addPoints(a.player.id, pts));
    setWinnerSelection("Impostors");
  };

  const handleAwardSpecificImpostor = (id: string, name: string) => {
    if (winnerSelection) return;
    const pts = scoringMode === "extended" ? 4 : 1;
    addPoints(id, pts);
    setWinnerSelection(name);
  };

  const handlePlayAgain = () => {
    reset();
    router.replace("/games/impostor/setup");
  };

  const handleHome = () => {
    reset();
    router.replace("/hub");
  };

  const handleViewStandings = () => {
    reset();
    router.replace("/standings");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Timer */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Timer</Text>
          {showTimer ? (
            <View style={styles.timerBox}>
              <Timer initialSeconds={180} accentColor={ACCENT} />
            </View>
          ) : (
            <Button
              label="Start 3-Minute Timer"
              onPress={() => setShowTimer(true)}
              variant="secondary"
              accentColor={ACCENT}
              fullWidth
            />
          )}

          {speakingOrder.length > 0 && (
            <View style={styles.speakingOrderBox}>
              <Text style={styles.speakingOrderLabel}>Speaking order</Text>
              <Text style={styles.speakingOrderText}>
                {speakingOrder.map((p) => p.name).join("  →  ")}
              </Text>
            </View>
          )}
        </View>

        {/* Secret word reveal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Secret word</Text>
          {wordRevealed ? (
            <View style={styles.wordBox}>
              <Text style={styles.word}>{secretWord}</Text>
              <Text style={styles.impostorLine}>
                Impostor{impostors.length > 1 ? "s" : ""}:{" "}
                <Text style={{ color: ACCENT }}>
                  {impostors.map((a) => a.player.name).join(", ")}
                </Text>
              </Text>
            </View>
          ) : (
            <Pressable style={styles.revealWordBtn} onPress={() => setWordRevealed(true)}>
              <Text style={styles.revealWordText}>Tap to reveal word & impostor</Text>
            </Pressable>
          )}
        </View>

        {/* Winner picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Who won this round?</Text>
          {winnerSelection ? (
            <View style={styles.winnerBadge}>
              <Text style={styles.winnerBadgeText}>🏆 {winnerSelection} wins the round!</Text>
            </View>
          ) : (
            <>
              <View style={styles.teamBtnRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.teamBtn,
                    { borderColor: palette.success },
                    pressed && { backgroundColor: palette.success + "22" },
                  ]}
                  onPress={handleAwardCrewmates}
                >
                  <Text style={styles.teamBtnEmoji}>🎉</Text>
                  <Text style={[styles.teamBtnText, { color: palette.success }]}>Crewmates</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.teamBtn,
                    { borderColor: ACCENT },
                    pressed && { backgroundColor: ACCENT + "22" },
                  ]}
                  onPress={handleAwardImpostors}
                >
                  <Text style={styles.teamBtnEmoji}>🕵️</Text>
                  <Text style={[styles.teamBtnText, { color: ACCENT }]}>Impostors</Text>
                </Pressable>
              </View>
              {impostors.length > 1 && (
                <View style={styles.specificImpostorSection}>
                  <Text style={styles.specificLabel}>Or pick a specific impostor:</Text>
                  <View style={styles.playerGrid}>
                    {impostors.map((a) => (
                      <Pressable
                        key={a.player.id}
                        style={({ pressed }) => [
                          styles.playerBtn,
                          pressed && styles.playerBtnPressed,
                        ]}
                        onPress={() => handleAwardSpecificImpostor(a.player.id, a.player.name)}
                      >
                        <Text style={styles.playerBtnText}>{a.player.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button label="Play Again" onPress={handlePlayAgain} accentColor={ACCENT} fullWidth />
          <Button
            label="View Standings"
            onPress={handleViewStandings}
            variant="secondary"
            accentColor={ACCENT}
            fullWidth
          />
          <Button
            label="Back to Hub"
            onPress={handleHome}
            variant="ghost"
            accentColor={ACCENT}
            fullWidth
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },

  section: { gap: spacing.md },
  sectionLabel: { ...typography.label, color: palette.muted },

  timerBox: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    alignItems: "center",
  },

  speakingOrderBox: {
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 2,
  },
  speakingOrderLabel: { ...typography.caption, color: palette.muted },
  speakingOrderText: { ...typography.bodyBold, color: palette.white },

  wordBox: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  word: { ...typography.display, color: palette.white },
  impostorLine: { ...typography.bodyBold, color: palette.muted },

  revealWordBtn: {
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.lg,
    alignItems: "center",
  },
  revealWordText: { ...typography.bodyBold, color: palette.muted },

  teamBtnRow: { flexDirection: "row", gap: spacing.md },
  teamBtn: {
    flex: 1,
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  teamBtnEmoji: { fontSize: 32 },
  teamBtnText: { ...typography.heading3 },
  specificImpostorSection: { gap: spacing.sm },
  specificLabel: { ...typography.caption, color: palette.muted },
  playerGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  playerBtn: {
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  playerBtnPressed: { borderColor: palette.warning, backgroundColor: palette.warning + "22" },
  playerBtnText: { ...typography.bodyBold, color: palette.white },

  winnerBadge: {
    backgroundColor: palette.warning + "22",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.warning,
    padding: spacing.md,
    alignItems: "center",
  },
  winnerBadgeText: { ...typography.bodyBold, color: palette.warning },

  actions: { gap: spacing.md },
});
