import React, { useState, useEffect } from "react";
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
import { palette, spacing, typography, shadows } from "../../../src/theme";
import {
  useImpostorStore,
  computeResults,
} from "../../../src/games/impostor/gameStore";
import { usePlayerStore } from "../../../src/store/players";
import { useSessionStore } from "../../../src/store/session";
import { getGameTheme } from "../../../src/games/registry";
import { HandshakeIcon } from "../../../src/assets/icons/HandshakeIcon";
import { CrewmateIcon } from "../../../src/assets/icons/CrewmateIcon";
import { ImpostorIcon } from "../../../src/assets/icons/ImpostorIcon";
import { TrophyIcon } from "../../../src/assets/icons/TrophyIcon";
import ConfettiCannon from "react-native-confetti-cannon";
import { BackButton } from "../../../src/components/BackButton";
import { playSfx } from "../../../src/hooks/useSoundEffects";

const GAME_THEME = getGameTheme("impostor");
const ACCENT = GAME_THEME.accent;
const POINTS_PER_WIN = 1;
const { width: screenWidth } = Dimensions.get("window");

export default function ResultsScreen() {
  const router = useRouter();
  const assignments = useImpostorStore((s) => s.assignments);
  const votes = useImpostorStore((s) => s.votes);
  const secretWord = useImpostorStore((s) => s.secretWord);
  const reset = useImpostorStore((s) => s.reset);
  const addPoints = usePlayerStore((s) => s.addPoints);

  const [winnerSelection, setWinnerSelection] = useState<string | null>(null);

  useEffect(() => {
    if (!isTie) playSfx(crewmatesWin ? "fanfare" : "wrong");
  }, []);

  const { tally, impostors, isTie, eliminatedIds, crewmatesWin } =
    computeResults(assignments, votes);

  const crewmates = assignments.filter((a) => a.role === "crewmate").map((a) => a.player);

  const handleAwardCrewmates = () => {
    if (winnerSelection) return;
    crewmates.forEach((p) => addPoints(p.id, POINTS_PER_WIN));
    setWinnerSelection("Crewmates");
  };

  const handleAwardImpostors = () => {
    if (winnerSelection) return;
    impostors.forEach((p) => addPoints(p.id, POINTS_PER_WIN));
    setWinnerSelection("Impostors");
  };

  const handleAwardSpecificImpostor = (id: string, name: string) => {
    if (winnerSelection) return;
    addPoints(id, POINTS_PER_WIN);
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
    <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Outcome banner */}
        <View
          style={[
            styles.outcomeBanner,
            {
              backgroundColor: isTie
                ? palette.warning + "22"
                : crewmatesWin
                ? palette.success + "22"
                : ACCENT + "22",
              borderColor: isTie
                ? palette.warning
                : crewmatesWin
                ? palette.success
                : ACCENT,
            },
          ]}
        >
          {isTie ? (
            <HandshakeIcon size={52} />
          ) : crewmatesWin ? (
            <CrewmateIcon size={64} />
          ) : (
            <ImpostorIcon size={52} />
          )}
          <Text
            style={[
              styles.outcomeTitle,
              {
                color: isTie
                  ? palette.warning
                  : crewmatesWin
                  ? palette.success
                  : ACCENT,
              },
            ]}
          >
            {isTie
              ? "It's a Tie!"
              : crewmatesWin
              ? "Crewmates Win!"
              : "Impostor Wins!"}
          </Text>
          <Text style={styles.outcomeDesc}>
            {isTie
              ? "Votes were split — no one is eliminated. The impostor escapes!"
              : crewmatesWin
              ? "The impostor was unmasked."
              : "The crewmates couldn't agree — the impostor slips away."}
          </Text>
        </View>

        {/* Secret word reveal */}
        <View style={styles.wordReveal}>
          <Text style={styles.wordLabel}>The secret word was</Text>
          <Text style={styles.word}>{secretWord}</Text>
        </View>

        {/* Impostors */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {impostors.length === 1 ? "The Impostor" : "The Impostors"}
          </Text>
          {impostors.map((p) => (
            <View key={p.id} style={[styles.playerRow, { borderColor: ACCENT }]}>
              <ImpostorIcon size={24} />
              <Text style={[styles.playerName, { color: ACCENT }]}>{p.name}</Text>
            </View>
          ))}
        </View>

        {/* Vote tally */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Vote tally</Text>
          {assignments.map((a) => {
            const count = tally[a.player.id] ?? 0;
            const isEliminated = eliminatedIds.includes(a.player.id);
            return (
              <View key={a.player.id} style={styles.tallyRow}>
                <Text style={[styles.tallyName, isEliminated && { color: ACCENT }]}>
                  {a.player.name}
                  {isEliminated && !isTie ? " ← out" : ""}
                </Text>
                <View style={styles.tallyBarWrap}>
                  <View
                    style={[
                      styles.tallyBar,
                      {
                        flex: count / Math.max(assignments.length, 1),
                        backgroundColor: isEliminated ? ACCENT : palette.border,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.tallyCount, isEliminated && { color: ACCENT }]}>
                  {count}
                </Text>
              </View>
            );
          })}
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
                  <View style={styles.winnerGrid}>
                    {impostors.map((p) => (
                      <Pressable
                        key={p.id}
                        style={({ pressed }) => [
                          styles.winnerBtn,
                          pressed && styles.winnerBtnPressed,
                        ]}
                        onPress={() => handleAwardSpecificImpostor(p.id, p.name)}
                      >
                        <Text style={styles.winnerBtnText}>{p.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

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

      <BackButton onPress={handleHome} />
      <ConfettiCannon
        count={120}
        origin={{ x: screenWidth / 2, y: -20 }}
        autoStart={true}
        fadeOut={true}
        colors={["#FF2D78", "#FF6FA3", "#FFFFFF", "#FFB3CC"]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
  outcomeBanner: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.md,
  },
  outcomeTitle: { ...typography.heading1 },
  outcomeDesc: { ...typography.body, color: palette.muted, textAlign: "center" },
  wordReveal: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.md,
  },
  wordLabel: { ...typography.label, color: palette.muted },
  word: { ...typography.display, color: palette.white },
  section: { gap: spacing.md },
  sectionLabel: { ...typography.label, color: palette.muted },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: spacing.md,
    ...shadows.sm,
  },
  playerName: { ...typography.heading3 },
  tallyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  tallyName: { ...typography.body, color: palette.white, width: 110 },
  tallyBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: palette.bgCard,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
  },
  tallyBar: { height: 8, borderRadius: 4 },
  tallyCount: { ...typography.bodyBold, color: palette.muted, width: 20, textAlign: "right" },

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
  winnerGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  winnerBtn: {
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...shadows.sm,
  },
  winnerBtnPressed: { borderColor: palette.warning, backgroundColor: palette.warning + "22" },
  winnerBtnText: { ...typography.bodyBold, color: palette.white },
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
