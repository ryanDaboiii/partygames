import React, { useState, useEffect } from "react";
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
import { palette, spacing, typography } from "../../../src/theme";
import { useTabooStore } from "../../../src/games/taboo/store";
import { usePlayerStore } from "../../../src/store/players";
import { useSessionStore } from "../../../src/store/session";
import {
  subscribeToSession,
  setSessionCurrentGame,
  type SessionPlayer,
} from "../../../src/firebase/sessions";
import { useGameIntro } from "../../../src/components/GameIntroOverlay";

const ACCENT = palette.taboo;
const TIME_OPTIONS = [30, 45, 60, 90];
const MIN_PLAYERS = 2;

function OptionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && { backgroundColor: ACCENT, borderColor: ACCENT }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && { color: palette.white }]}>{label}</Text>
    </Pressable>
  );
}

export default function TabooSetupScreen() {
  const router = useRouter();
  const startGame = useTabooStore((s) => s.startGame);
  const reset = useTabooStore((s) => s.reset);
  const mode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const scoringMode = useSessionStore((s) => s.scoringMode);
  const localPlayers = usePlayerStore((s) => s.players);
  const { showThen, overlay } = useGameIntro();

  const [roundTimeSecs, setRoundTimeSecs] = useState(60);
  const [totalRounds, setTotalRounds] = useState(1);
  const [liveSessionPlayers, setLiveSessionPlayers] = useState<Record<string, SessionPlayer>>({});

  const isOnline = mode === "online";

  useEffect(() => {
    if (!isOnline || !sessionCode) return;
    return subscribeToSession(sessionCode, (data) => setLiveSessionPlayers(data.players));
  }, [isOnline, sessionCode]);

  const players: string[] = isOnline
    ? Object.values(liveSessionPlayers).map((p) => p.name)
    : localPlayers.map((p) => p.name);

  const canStart = players.length >= MIN_PLAYERS;

  const handleStart = async () => {
    if (!canStart) return;
    reset();
    startGame({ players, roundTimeSecs, totalRounds, scoringMode });
    if (isOnline && sessionCode) {
      try { await setSessionCurrentGame(sessionCode, "taboo"); } catch (_) {}
    }
    showThen(
      { icon: "🚫", title: "Taboo", accentColor: ACCENT },
      () => router.replace("/games/taboo/turn-start")
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.icon}>🚫</Text>
          <Text style={styles.title}>Taboo</Text>
          <Text style={styles.tagline}>
            Describe the word without saying{"\n"}any of the forbidden words.
          </Text>
        </View>

        {/* Players */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Players ({players.length})</Text>
          {players.length === 0 ? (
            <Text style={styles.emptyText}>
              {isOnline
                ? "Waiting for players to join…"
                : "No players yet. Go back and add players."}
            </Text>
          ) : (
            <View style={styles.playerList}>
              {players.map((name) => (
                <View key={name} style={styles.playerRow}>
                  <Text style={styles.playerName}>{name}</Text>
                </View>
              ))}
            </View>
          )}
          {players.length === 1 && (
            <Text style={styles.warningText}>Need at least 2 players to start.</Text>
          )}
        </View>

        {/* Turn time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Turn time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {TIME_OPTIONS.map((t) => (
                <OptionChip
                  key={t}
                  label={`${t}s`}
                  selected={roundTimeSecs === t}
                  onPress={() => setRoundTimeSecs(t)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Rounds per player */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rounds per player</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={[styles.stepBtn, totalRounds <= 1 && styles.stepBtnDisabled]}
              onPress={() => setTotalRounds((r) => Math.max(1, r - 1))}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepValue}>{totalRounds}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setTotalRounds((r) => r + 1)}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.roundsHint}>
            {players.length >= MIN_PLAYERS
              ? `${players.length * totalRounds} total turns`
              : `Each player gets ${totalRounds} turn${totalRounds !== 1 ? "s" : ""} as Explainer`}
          </Text>
        </View>

        <Button
          label="Start Game"
          onPress={handleStart}
          accentColor={ACCENT}
          disabled={!canStart}
          fullWidth
          style={styles.startBtn}
        />
      </ScrollView>
      {overlay}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  back: { marginBottom: spacing.lg },
  backText: { ...typography.bodyBold, color: palette.muted },

  hero: { alignItems: "center", marginVertical: spacing.xl },
  icon: { fontSize: 64, marginBottom: spacing.md },
  title: { ...typography.display, color: palette.white, marginBottom: spacing.sm },
  tagline: {
    ...typography.body,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 24,
  },

  section: { marginBottom: spacing.xl },
  sectionLabel: { ...typography.label, color: palette.muted, marginBottom: spacing.md },

  emptyText: { ...typography.body, color: palette.muted },
  playerList: { gap: spacing.sm },
  playerRow: {
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  playerName: { ...typography.bodyBold, color: palette.white },
  warningText: { ...typography.caption, color: palette.danger, marginTop: spacing.sm },

  chipRow: { flexDirection: "row", gap: spacing.sm },
  chip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { ...typography.caption, color: palette.muted },

  stepperRow: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnDisabled: { opacity: 0.35 },
  stepBtnText: { ...typography.heading2, color: palette.white },
  stepValue: {
    ...typography.heading1,
    color: palette.white,
    minWidth: 40,
    textAlign: "center",
  },
  roundsHint: { ...typography.caption, color: palette.muted, marginTop: spacing.sm },

  startBtn: { marginTop: spacing.md },
});
