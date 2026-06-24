import React, { useState } from "react";
import { BackButton } from "../../../src/components/BackButton";
import { ExitGameDialog } from "../../../src/components/ExitGameDialog";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { GameButton } from "../../../src/components/GameButton";
import { Timer } from "../../../src/components/Timer";
import { palette, spacing, typography, shadows } from "../../../src/theme";
import { useImpostorStore } from "../../../src/games/impostor/gameStore";
import { usePlayerStore } from "../../../src/store/players";
import { useSessionStore } from "../../../src/store/session";
import { getGameTheme } from "../../../src/games/registry";
import { TrophyIcon } from "../../../src/assets/icons/TrophyIcon";
import { CrewmateIcon } from "../../../src/assets/icons/CrewmateIcon";
import { ImpostorIcon } from "../../../src/assets/icons/ImpostorIcon";
import ConfettiCannon from "react-native-confetti-cannon";

const GAME_THEME = getGameTheme("impostor");
const ACCENT = GAME_THEME.accent;
const { width: screenWidth } = Dimensions.get("window");

export default function DiscussionScreen() {
  const router = useRouter();
  const assignments = useImpostorStore((s) => s.assignments);
  const secretWord = useImpostorStore((s) => s.secretWord);
  const speakingOrder = useImpostorStore((s) => s.speakingOrder);
  const pointsAwardedThisGame = useImpostorStore((s) => s.pointsAwardedThisGame);
  const recordPointsAwarded = useImpostorStore((s) => s.recordPointsAwarded);
  const reset = useImpostorStore((s) => s.reset);
  const addPoints = usePlayerStore((s) => s.addPoints);
  const scoringMode = useSessionStore((s) => s.scoringMode);

  const [showTimer, setShowTimer] = useState(false);
  const [winnerSelection, setWinnerSelection] = useState<string | null>(null);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const impostors = assignments.filter((a) => a.role === "impostor");
  const crewmates = assignments.filter((a) => a.role === "crewmate");

  const handleAwardCrewmates = () => {
    if (winnerSelection) return;
    const pts = scoringMode === "extended" ? 3 : 1;
    crewmates.forEach((a) => { addPoints(a.player.id, pts); recordPointsAwarded(a.player.id, pts); });
    setWinnerSelection("Crewmates");
  };

  const handleAwardImpostors = () => {
    if (winnerSelection) return;
    const pts = scoringMode === "extended" ? 4 : 1;
    impostors.forEach((a) => { addPoints(a.player.id, pts); recordPointsAwarded(a.player.id, pts); });
    setWinnerSelection("Impostors");
  };

  const handleAwardSpecificImpostor = (id: string, name: string) => {
    if (winnerSelection) return;
    const pts = scoringMode === "extended" ? 4 : 1;
    addPoints(id, pts);
    recordPointsAwarded(id, pts);
    setWinnerSelection(name);
  };

  const handleExitKeep = () => { reset(); router.replace('/hub'); };
  const handleExitVoid = () => {
    Object.entries(pointsAwardedThisGame).forEach(([id, pts]) => {
      if (pts > 0) addPoints(id, -pts);
    });
    reset();
    router.replace('/hub');
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
    <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
      <ExitGameDialog
        visible={showExitDialog}
        onKeepScores={handleExitKeep}
        onVoidPoints={handleExitVoid}
        onCancel={() => setShowExitDialog(false)}
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Timer */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Timer</Text>
          {showTimer ? (
            <View style={styles.timerBox}>
              <Timer initialSeconds={180} accentColor={ACCENT} />
            </View>
          ) : (
            <GameButton
              label="Start 3-Minute Timer"
              onPress={() => setShowTimer(true)}
              color={palette.bgCard}
              textColor={palette.muted}
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TrophyIcon size={24} />
                <Text style={styles.winnerBadgeText}>{winnerSelection} wins the round!</Text>
              </View>
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
                  <CrewmateIcon size={32} />
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
                  <ImpostorIcon size={32} />
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
          <GameButton label="Play Again" onPress={handlePlayAgain} color={ACCENT} textColor={GAME_THEME.text} fullWidth />
          <GameButton
            label="View Standings"
            onPress={handleViewStandings}
            color={palette.bgCard}
            textColor={palette.muted}
            fullWidth
          />
          <GameButton
            label="Back to Hub"
            onPress={handleHome}
            color={palette.bgCard}
            textColor={palette.muted}
            fullWidth
          />
        </View>

      </ScrollView>
      <BackButton onPress={() => setShowExitDialog(true)} />
      {winnerSelection !== null && (
        <ConfettiCannon
          count={120}
          origin={{ x: screenWidth / 2, y: -20 }}
          autoStart={true}
          fadeOut={true}
          colors={["#FF2D78", "#FF6FA3", "#FFFFFF", "#FFB3CC"]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
    ...shadows.md,
  },

  speakingOrderBox: {
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 2,
    ...shadows.sm,
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
    ...shadows.md,
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
    ...shadows.sm,
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
    ...shadows.sm,
  },
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
    ...shadows.sm,
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
    ...shadows.sm,
  },
  winnerBadgeText: { ...typography.bodyBold, color: palette.warning },

  actions: { gap: spacing.md },
});
