import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { GameButton } from "../../../src/components/GameButton";
import { palette, spacing, typography, shadows } from "../../../src/theme";
import { useWavelengthStore } from "../../../src/games/wavelength/store";
import { useSessionStore } from "../../../src/store/session";
import { clearSessionCurrentGame } from "../../../src/firebase/sessions";
import { getGameTheme } from "../../../src/games/registry";
import { HandshakeIcon } from "../../../src/assets/icons/HandshakeIcon";
import { TrophyIcon } from "../../../src/assets/icons/TrophyIcon";
import { MedalIcon } from "../../../src/assets/icons/MedalIcon";
import { TargetIcon } from "../../../src/assets/icons/TargetIcon";
import ConfettiCannon from "react-native-confetti-cannon";
import { BackButton } from "../../../src/components/BackButton";

const GAME_THEME = getGameTheme("wavelength");
const ACCENT = GAME_THEME.accent;
const { width: screenWidth } = Dimensions.get("window");

export default function ScoreboardScreen() {
  const router = useRouter();
  const players = useWavelengthStore((s) => s.players);
  const history = useWavelengthStore((s) => s.history);
  const maxNumber = useWavelengthStore((s) => s.maxNumber);
  const totalRounds = useWavelengthStore((s) => s.totalRounds);
  const startGame = useWavelengthStore((s) => s.startGame);
  const reset = useWavelengthStore((s) => s.reset);
  const mode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);

  const gameScores: Record<string, number> = {};
  for (const p of players) gameScores[p.id] = 0;
  for (const r of history) {
    gameScores[r.guesserPlayerId] = (gameScores[r.guesserPlayerId] ?? 0) + r.guesserScore;
    if (r.correct) {
      for (const p of players) {
        if (p.id !== r.guesserPlayerId) {
          gameScores[p.id] = (gameScores[p.id] ?? 0) + r.nonGuesserBonus;
        }
      }
    }
  }

  const sorted = players
    .map((p) => ({ ...p, score: gameScores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const isTie = sorted.length >= 2 && sorted[0].score === sorted[1].score;
  const winner = sorted.length > 0 && !isTie ? sorted[0] : null;

  const handlePlayAgain = () => {
    const samePlayers = players.map((p) => ({ ...p }));
    reset();
    startGame({ players: samePlayers, maxNumber, totalRounds });
    router.replace("/games/wavelength/round");
  };

  const handleHome = async () => {
    reset();
    if (mode === "online" && sessionCode) {
      try { await clearSessionCurrentGame(sessionCode); } catch (_) {}
    }
    router.replace("/hub");
  };

  const handleViewStandings = () => {
    reset();
    router.replace("/standings");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Winner banner */}
        <View
          style={[
            styles.banner,
            { backgroundColor: isTie ? palette.warning + "22" : ACCENT + "22", borderColor: isTie ? palette.warning : ACCENT },
          ]}
        >
          {isTie ? <HandshakeIcon size={56} /> : <TrophyIcon size={56} />}
          <Text style={[styles.bannerTitle, { color: isTie ? palette.warning : ACCENT }]}>
            {isTie ? "It's a Tie!" : winner ? `${winner.name} Wins!` : "Game Over"}
          </Text>
          <Text style={styles.bannerSub}>
            {sorted[0]?.score ?? 0} {isTie ? `– ${sorted[1]?.score ?? 0}` : "points"}
          </Text>
        </View>

        {/* Round summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>This Game</Text>
          {sorted.map((p, i) => (
            <View
              key={p.id}
              style={[styles.scoreRow, i === 0 && !isTie && { borderColor: ACCENT }]}
            >
              <View style={{ width: 34, alignItems: "center", justifyContent: "center" }}>
                {i === 0 && !isTie ? (
                  <MedalIcon rank={1} size={28} />
                ) : i === 1 ? (
                  <MedalIcon rank={2} size={28} />
                ) : i === 2 ? (
                  <MedalIcon rank={3} size={28} />
                ) : (
                  <Text style={styles.rank}>{i + 1}.</Text>
                )}
              </View>
              <Text style={styles.scoreName}>{p.name}</Text>
              <Text style={[styles.scorePoints, i === 0 && !isTie && { color: ACCENT }]}>
                {p.score} pts
              </Text>
            </View>
          ))}
        </View>

        {/* Round recap */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Round Recap</Text>
          {history.map((r, i) => {
            const guesser = players.find((p) => p.id === r.guesserPlayerId);
            return (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyRound}>R{r.roundNumber}</Text>
                <View style={styles.historyMid}>
                  <Text style={styles.historyGuesser}>{guesser?.name ?? "?"}</Text>
                  {r.correct ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={styles.historyNumbers}>Secret was {r.secretNumber} — Got it!</Text>
                      <TargetIcon size={16} />
                    </View>
                  ) : (
                    <Text style={styles.historyNumbers}>Secret was {r.secretNumber} — Wrong</Text>
                  )}
                </View>
                <View style={[styles.historyScore, { borderColor: ptColor(r.guesserScore), backgroundColor: ptColor(r.guesserScore) + "22" }]}>
                  <Text style={[styles.historyScoreText, { color: ptColor(r.guesserScore) }]}>
                    {r.guesserScore > 0 ? `+${r.guesserScore}` : "0"}
                  </Text>
                  {r.nonGuesserBonus > 0 && (
                    <Text style={styles.historyScoreBonus}>+{r.nonGuesserBonus} ea.</Text>
                  )}
                </View>
              </View>
            );
          })}
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

      <BackButton onPress={handleHome} color={GAME_THEME.accent} />
      <ConfettiCannon
        count={120}
        origin={{ x: screenWidth / 2, y: -20 }}
        autoStart={true}
        fadeOut={true}
        colors={["#4FC3F7", "#87D8FA", "#FFFFFF", "#A8DCEF"]}
      />
    </SafeAreaView>
  );
}

function ptColor(score: number): string {
  if (score >= 5) return palette.warning;
  if (score >= 3) return palette.success;
  if (score >= 1) return ACCENT;
  return palette.muted;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
  banner: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.md,
  },
  bannerTitle: { ...typography.heading1 },
  bannerSub: { ...typography.heading3, color: palette.muted },
  section: { gap: spacing.md },
  sectionLabel: { ...typography.label, color: palette.muted },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  rank: { fontSize: 22, width: 34, color: palette.muted },
  scoreName: { ...typography.bodyBold, color: palette.white, flex: 1 },
  scorePoints: { ...typography.heading3, color: palette.muted },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  historyRound: { ...typography.label, color: palette.muted, width: 28 },
  historyMid: { flex: 1, gap: 2 },
  historyGuesser: { ...typography.caption, color: palette.muted },
  historyNumbers: { ...typography.bodyBold, color: palette.white },
  historyScore: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 44,
    alignItems: "center",
  },
  historyScoreText: { ...typography.bodyBold },
  historyScoreBonus: { ...typography.label, color: palette.muted, fontSize: 9 },
  actions: { gap: spacing.md },
});
