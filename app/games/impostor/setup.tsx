import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../src/components/Button";
import { palette, spacing, typography } from "../../../src/theme";
import { CATEGORIES } from "../../../src/games/impostor/words";
import { useImpostorStore } from "../../../src/games/impostor/gameStore";
import { usePlayerStore } from "../../../src/store/players";
import { useSessionStore } from "../../../src/store/session";
import {
  startImpostorGame,
  setSessionCurrentGame,
  subscribeToSession,
  type SessionPlayer,
} from "../../../src/firebase/sessions";
import { useGameIntro } from "../../../src/components/GameIntroOverlay";
import type { ImpostorCategory, Player, VotingMode } from "../../../src/games/impostor/types";

const ACCENT = palette.impostor;
const MIN_PLAYERS = 3;

function suggestImpostors(count: number) {
  return count >= 7 ? 2 : 1;
}

export default function SetupScreen() {
  const router = useRouter();
  const startGame = useImpostorStore((s) => s.startGame);
  const reset = useImpostorStore((s) => s.reset);
  const roster = usePlayerStore((s) => s.players);
  const sessionMode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const myPlayerName = useSessionStore((s) => s.myPlayerName);

  const isOnline = sessionMode === "online";

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const initialized = useRef(false);
  const [impostorCount, setImpostorCount] = useState(1);
  const [category, setCategory] = useState<ImpostorCategory>("Animals");
  const [votingMode, setVotingMode] = useState<VotingMode>("app");
  const [starting, setStarting] = useState(false);
  const { showThen, overlay } = useGameIntro();

  // Live session players (online mode only — for reactive player count)
  const [liveSessionPlayers, setLiveSessionPlayers] = useState<Record<string, SessionPlayer>>({});

  useEffect(() => {
    if (!isOnline || !sessionCode) return;
    return subscribeToSession(sessionCode, (data) => {
      setLiveSessionPlayers(data.players);
    });
  }, [isOnline, sessionCode]);

  const onlinePlayerCount = Object.keys(liveSessionPlayers).length;
  const onlinePlayerNames = Object.values(liveSessionPlayers).map((p) => p.name);

  // Default: everyone selected (offline only)
  useEffect(() => {
    if (!initialized.current && roster.length > 0) {
      setSelectedIds(new Set(roster.map((p) => p.id)));
      setImpostorCount(suggestImpostors(roster.length));
      initialized.current = true;
    }
  }, [roster]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;
  const maxImpostors = isOnline
    ? Math.max(1, Math.floor(onlinePlayerCount / 2))
    : Math.max(1, Math.floor(selectedCount / 2));

  useEffect(() => {
    setImpostorCount((c) => Math.min(Math.max(1, c), maxImpostors));
  }, [maxImpostors]);

  const canStart = isOnline
    ? onlinePlayerCount >= MIN_PLAYERS
    : selectedCount >= MIN_PLAYERS;

  const handleStart = async () => {
    if (isOnline) {
      if (!sessionCode) {
        Alert.alert("No session", "No active session found.");
        return;
      }
      if (onlinePlayerCount < MIN_PLAYERS) {
        Alert.alert(
          "Not enough players",
          `Impostor needs at least ${MIN_PLAYERS} players. Ask more players to join the session.`
        );
        return;
      }
      setStarting(true);
      try {
        reset();
        await startImpostorGame(sessionCode, liveSessionPlayers, category, impostorCount, votingMode);
        await setSessionCurrentGame(sessionCode, "impostor");
        showThen(
          { icon: "🕵️", title: "Impostor", accentColor: ACCENT },
          () => router.replace("/games/impostor/online/play")
        );
      } catch (e: any) {
        Alert.alert("Error", e.message);
        setStarting(false);
      }
    } else {
      // Offline: pass-and-play with selected session players
      if (selectedCount < MIN_PLAYERS) {
        Alert.alert("Not enough players", `Select at least ${MIN_PLAYERS} players.`);
        return;
      }
      const players: Player[] = roster
        .filter((p) => selectedIds.has(p.id))
        .map((p) => ({ id: p.id, name: p.name }));
      reset();
      startGame({ mode: "pass-and-play", players, impostorCount, category });
      showThen(
        { icon: "🕵️", title: "Impostor", accentColor: ACCENT },
        () => router.push("/games/impostor/reveal")
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.icon}>🕵️</Text>
          <Text style={styles.title}>Impostor</Text>
          <Text style={styles.tagline}>
            Most players share a secret word.{"\n"}One has no idea — can they bluff?
          </Text>
        </View>

        {/* Category */}
        <Section label="Category">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.chip,
                    category === cat && { backgroundColor: ACCENT, borderColor: ACCENT },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat && { color: palette.white },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Section>

        {/* Impostor count */}
        <Section label="Number of impostors">
          <View style={styles.stepper}>
            <Pressable
              style={[styles.stepBtn, impostorCount <= 1 && styles.stepBtnDisabled]}
              onPress={() => setImpostorCount((c) => Math.max(1, c - 1))}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepValue}>{impostorCount}</Text>
            <Pressable
              style={[styles.stepBtn, impostorCount >= maxImpostors && styles.stepBtnDisabled]}
              onPress={() => setImpostorCount((c) => Math.min(maxImpostors, c + 1))}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            Suggested: {suggestImpostors(isOnline ? onlinePlayerCount : selectedCount)} for{" "}
            {isOnline ? onlinePlayerCount : selectedCount} players
          </Text>
        </Section>

        {/* Players section */}
        {isOnline ? (
          <Section label={`Players in session (${onlinePlayerCount})`}>
            {onlinePlayerCount < MIN_PLAYERS ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningBoxText}>
                  Impostor needs at least {MIN_PLAYERS} players. Ask more players to join the session.
                </Text>
              </View>
            ) : (
              <View style={styles.rosterList}>
                {onlinePlayerNames.map((name) => (
                  <View key={name} style={styles.rosterRow}>
                    <Text style={styles.rosterName}>{name}</Text>
                    {name === myPlayerName && (
                      <Text style={styles.youLabel}>you</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Section>
        ) : (
          <Section label="Players">
            {roster.length === 0 ? (
              <Text style={styles.noRosterText}>
                No players in your session. Go back and add players first.
              </Text>
            ) : (
              <View style={styles.rosterList}>
                {roster.map((p) => {
                  const selected = selectedIds.has(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      style={[styles.rosterRow, selected && { borderColor: ACCENT }]}
                      onPress={() => toggleSelected(p.id)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selected && { backgroundColor: ACCENT, borderColor: ACCENT },
                        ]}
                      >
                        {selected && <Text style={styles.checkboxMark}>✓</Text>}
                      </View>
                      <Text style={styles.rosterName}>{p.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {selectedCount < MIN_PLAYERS && (
              <Text style={styles.warningText}>
                Select at least {MIN_PLAYERS} players to start.
              </Text>
            )}
          </Section>
        )}

        {/* Voting mode — only meaningful in online mode; pass-and-play always uses host-decides */}
        {isOnline && <View style={styles.votingModeSection}>
          <Text style={styles.votingModeSectionLabel}>VOTING MODE</Text>
          <View style={styles.votingModeRow}>
            <Pressable
              style={[
                styles.votingModeCard,
                votingMode === "app" && { borderColor: ACCENT, backgroundColor: ACCENT + "18" },
              ]}
              onPress={() => setVotingMode("app")}
            >
              <Text style={styles.votingModeIcon}>🗳️</Text>
              <Text style={[styles.votingModeTitle, votingMode === "app" && { color: ACCENT }]}>
                In-App Voting
              </Text>
              <Text style={styles.votingModeDesc}>
                Each player votes privately on their device
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.votingModeCard,
                votingMode === "host" && { borderColor: ACCENT, backgroundColor: ACCENT + "18" },
              ]}
              onPress={() => setVotingMode("host")}
            >
              <Text style={styles.votingModeIcon}>🗣️</Text>
              <Text style={[styles.votingModeTitle, votingMode === "host" && { color: ACCENT }]}>
                Host Decides
              </Text>
              <Text style={styles.votingModeDesc}>
                Group votes aloud, host picks the result
              </Text>
            </Pressable>
          </View>
        </View>}

        <Button
          label="Start Game"
          onPress={handleStart}
          accentColor={ACCENT}
          loading={starting}
          fullWidth
          disabled={!canStart}
          style={styles.startBtn}
        />
      </ScrollView>
      {overlay}
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  label: { ...typography.label, color: palette.muted, marginBottom: spacing.md },
});

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
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: "row", gap: spacing.sm },
  chip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { ...typography.caption, color: palette.muted },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
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
  hint: { ...typography.caption, color: palette.muted, marginTop: spacing.sm },
  warningBox: {
    backgroundColor: palette.danger + "22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.danger,
    padding: spacing.md,
  },
  warningBoxText: { ...typography.caption, color: palette.danger },
  noRosterText: { ...typography.body, color: palette.muted },
  rosterList: { gap: spacing.sm },
  rosterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxMark: { color: palette.white, fontSize: 14, fontWeight: "700" },
  rosterName: { ...typography.bodyBold, color: palette.white, flex: 1 },
  youLabel: {
    ...typography.caption,
    color: ACCENT,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  warningText: { ...typography.caption, color: palette.danger, marginTop: spacing.sm },
  startBtn: { marginTop: spacing.sm },
  votingModeSection: { marginBottom: spacing.lg },
  votingModeSectionLabel: {
    ...typography.label,
    color: palette.muted,
    marginBottom: spacing.md,
  },
  votingModeRow: { flexDirection: "row", gap: spacing.md },
  votingModeCard: {
    flex: 1,
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.md,
    alignItems: "center",
  },
  votingModeIcon: { fontSize: 28, marginBottom: spacing.xs },
  votingModeTitle: {
    ...typography.caption,
    color: palette.white,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginBottom: spacing.xs,
  },
  votingModeDesc: {
    ...typography.caption,
    color: palette.muted,
    textAlign: "center" as const,
    lineHeight: 18,
  },
});
