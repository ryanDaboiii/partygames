import React, { useEffect } from "react";
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
import { useTabooStore } from "../../../src/games/taboo/store";
import { useSessionStore } from "../../../src/store/session";
import { clearSessionCurrentGame } from "../../../src/firebase/sessions";
import { getGameTheme } from "../../../src/games/registry";
import { HandshakeIcon } from "../../../src/assets/icons/HandshakeIcon";
import { TrophyIcon } from "../../../src/assets/icons/TrophyIcon";
import { MedalIcon } from "../../../src/assets/icons/MedalIcon";
import { CheckIcon } from "../../../src/assets/icons/CheckIcon";
import { SkipIcon } from "../../../src/assets/icons/SkipIcon";
import { BanIcon } from "../../../src/assets/icons/BanIcon";
import ConfettiCannon from "react-native-confetti-cannon";
import { BackButton } from "../../../src/components/BackButton";
import { playSfx } from "../../../src/hooks/useSoundEffects";

const GAME_THEME = getGameTheme("taboo");
const ACCENT = GAME_THEME.accent;
const { width: screenWidth } = Dimensions.get("window");

export default function TabooScoreboardScreen() {
  const router = useRouter();
  const hasNavigated = React.useRef(false);
  const players = useTabooStore((s) => s.players);
  const gamePoints = useTabooStore((s) => s.gamePoints);
  const turnHistory = useTabooStore((s) => s.turnHistory);
  const totalRounds = useTabooStore((s) => s.totalRounds);
  const roundTimeSecs = useTabooStore((s) => s.roundTimeSecs);
  const startGame = useTabooStore((s) => s.startGame);
  const reset = useTabooStore((s) => s.reset);

  const mode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const scoringMode = useSessionStore((s) => s.scoringMode);

  useEffect(() => { playSfx("fanfare"); }, []);

  const ranked = [...players].sort((a, b) => (gamePoints[b] ?? 0) - (gamePoints[a] ?? 0));
  const topScore = ranked.length > 0 ? (gamePoints[ranked[0]] ?? 0) : 0;
  const winners = ranked.filter((n) => (gamePoints[n] ?? 0) === topScore);
  const isTie = winners.length !== 1;

  const playerStats: Record<string, { correct: number; passed: number; taboos: number }> = {};
  for (const p of players) playerStats[p] = { correct: 0, passed: 0, taboos: 0 };
  for (const turn of turnHistory) {
    const s = playerStats[turn.cluegiver];
    if (s) {
      s.correct += turn.correct;
      s.passed += turn.passed;
      s.taboos += turn.taboos;
    }
  }

  const handlePlayAgain = () => {
    startGame({ players, roundTimeSecs, totalRounds, scoringMode });
    router.replace("/games/taboo/turn-start");
  };

  const handleBackToHub = async () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    router.replace("/hub");
    reset();
    if (mode === "online" && sessionCode) {
      try { await clearSessionCurrentGame(sessionCode); } catch (_) {}
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {isTie ? <HandshakeIcon size={36} /> : <TrophyIcon size={36} />}
          <Text style={styles.title}>
            {isTie ? "It's a Tie!" : `${winners[0]} Wins!`}
          </Text>
        </View>

        {/* Rankings */}
        <View style={styles.rankList}>
          {ranked.map((name, idx) => {
            const isWinner = winners.includes(name);
            const pts = gamePoints[name] ?? 0;
            const stats = playerStats[name];
            const medalEl = idx === 0 ? <MedalIcon rank={1} size={28} /> : idx === 1 ? <MedalIcon rank={2} size={28} /> : idx === 2 ? <MedalIcon rank={3} size={28} /> : null;

            return (
              <View
                key={name}
                style={[styles.rankRow, isWinner && styles.rankRowWinner]}
              >
                <View style={{ width: 36, alignItems: "center", justifyContent: "center" }}>
                  {medalEl ?? <Text style={styles.medal}>{idx + 1}.</Text>}
                </View>
                <View style={styles.rankInfo}>
                  <Text style={[styles.rankName, isWinner && { color: ACCENT }]}>{name}</Text>
                  {stats && (
                    <View style={styles.statRow}>
                      <StatBit label={<CheckIcon size={14} />} value={stats.correct} color={palette.success} />
                      <StatBit label={<SkipIcon size={14} />} value={stats.passed} color={palette.muted} />
                      <StatBit label={<BanIcon size={14} />} value={stats.taboos} color={palette.danger} />
                    </View>
                  )}
                </View>
                <Text style={[styles.rankScore, isWinner && { color: ACCENT }]}>{pts}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <GameButton
            label="Play Again"
            onPress={handlePlayAgain}
            color={ACCENT}
            textColor={GAME_THEME.text}
            fullWidth
          />
          <GameButton
            label="Back to Hub"
            onPress={handleBackToHub}
            color={palette.bgCard}
            textColor={palette.muted}
            fullWidth
          />
        </View>
      </ScrollView>

      <BackButton onPress={handleBackToHub} color={GAME_THEME.accent} />
      <ConfettiCannon
        count={120}
        origin={{ x: screenWidth / 2, y: -20 }}
        autoStart={true}
        fadeOut={true}
        colors={["#69F0AE", "#9EFFC8", "#FFFFFF", "#111111"]}
      />
    </SafeAreaView>
  );
}

function StatBit({ label, value, color }: { label: React.ReactNode; value: number; color: string }) {
  return (
    <View style={statStyles.container}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <View style={statStyles.labelWrap}>{label}</View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: { alignItems: "center", minWidth: 32 },
  value: { ...typography.bodyBold, color: palette.white },
  labelWrap: { marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },

  title: { ...typography.display, color: palette.white, textAlign: "center" },

  rankList: { gap: spacing.sm },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  rankRowWinner: {
    borderColor: ACCENT,
    backgroundColor: GAME_THEME.accentMuted,
    borderWidth: 1.5,
  },
  medal: { fontSize: 24, width: 36, textAlign: "center" },
  rankInfo: { flex: 1, gap: 4 },
  rankName: { ...typography.bodyBold, color: palette.white },
  statRow: { flexDirection: "row", gap: spacing.sm },
  rankScore: {
    fontSize: 32,
    fontWeight: "900",
    color: palette.white,
    minWidth: 40,
    textAlign: "right",
  },

  actions: { gap: spacing.sm, marginTop: spacing.md },
});
