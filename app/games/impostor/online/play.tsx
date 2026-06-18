import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { HoldToReveal } from "../../../../src/components/HoldToReveal";
import { Button } from "../../../../src/components/Button";
import { Timer } from "../../../../src/components/Timer";
import { palette, spacing, typography } from "../../../../src/theme";
import { auth } from "../../../../src/firebase/config";
import { ensureAnonymousAuth } from "../../../../src/firebase/rooms";
import {
  subscribeToSession,
  subscribeToImpostorRole,
  endImpostorGame,
  setImpostorWinner,
  clearImpostorSession,
  clearSessionCurrentGame,
  type SessionData,
} from "../../../../src/firebase/sessions";
import { useSessionStore } from "../../../../src/store/session";
import type { PlayerRole } from "../../../../src/games/impostor/types";

const ACCENT = palette.impostor;

interface MyRole {
  role: PlayerRole;
  word?: string;
}

export default function OnlinePlayScreen() {
  const router = useRouter();
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const isHost = useSessionStore((s) => s.isHost);

  const [session, setSession] = useState<SessionData | null>(null);
  const [myRole, setMyRole] = useState<MyRole | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [winnerSelection, setWinnerSelection] = useState<"crewmates" | "impostors" | null>(null);

  // Resolve Firebase UID
  useEffect(() => {
    ensureAnonymousAuth().then((user) => setMyUid(user.uid));
  }, []);

  // Subscribe to session document for game state
  useEffect(() => {
    if (!sessionCode) return;
    return subscribeToSession(sessionCode, setSession);
  }, [sessionCode]);

  // Subscribe to own private role doc
  useEffect(() => {
    if (!sessionCode || !myUid) return;
    return subscribeToImpostorRole(sessionCode, myUid, (role) => {
      if (role) setMyRole(role);
    });
  }, [sessionCode, myUid]);

  // ── Handlers ───────────────────────────────────────────────

  const handleEndGame = () => {
    Alert.alert("End Game", "Are you sure you want to end the round?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Game",
        style: "destructive",
        onPress: async () => {
          setEnding(true);
          try {
            await endImpostorGame(sessionCode!);
          } catch (e: any) {
            Alert.alert("Error", e.message);
          } finally {
            setEnding(false);
          }
        },
      },
    ]);
  };

  const handlePickWinner = async (winner: "crewmates" | "impostors") => {
    setWinnerSelection(winner);
    try {
      await setImpostorWinner(sessionCode!, winner);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleHostBackToHub = async () => {
    if (sessionCode) {
      try {
        await clearImpostorSession(sessionCode);
        await clearSessionCurrentGame(sessionCode);
      } catch (_) {}
    }
    router.replace("/hub");
  };

  // ── Loading ────────────────────────────────────────────────

  if (!session || !session.impostorGame) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.loading}>Connecting…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const game = session.impostorGame;
  const sessionPlayers = session.players; // Record<uid, { name }>

  // ── Discussion ─────────────────────────────────────────────

  if (game.status === "discussion") {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.phase}>Discussion Phase</Text>
          <Text style={styles.title}>Time to talk 💬</Text>

          <View style={styles.roleSection}>
            <Text style={styles.sectionLabel}>Your role</Text>
            {myRole ? (
              <HoldToReveal accentColor={ACCENT}>
                {myRole.role === "impostor" ? (
                  <View style={styles.roleContent}>
                    <Text style={styles.roleName}>You are the Impostor 🕵️</Text>
                    <Text style={styles.roleTip}>You have NO word. Listen and bluff!</Text>
                  </View>
                ) : (
                  <View style={styles.roleContent}>
                    <Text style={styles.roleName}>Crewmate 👥</Text>
                    <Text style={styles.roleWord}>{myRole.word}</Text>
                  </View>
                )}
              </HoldToReveal>
            ) : (
              <Text style={styles.roleLoading}>Loading your role…</Text>
            )}
          </View>

          <Text style={styles.sectionLabel}>
            Players ({Object.keys(sessionPlayers).length})
          </Text>
          {Object.entries(sessionPlayers).map(([uid, { name }]) => (
            <View key={uid} style={styles.playerRow}>
              <Text style={styles.playerName}>{name}</Text>
              {uid === myUid && (
                <Text style={styles.youTag}>You</Text>
              )}
            </View>
          ))}

          <View style={styles.timerBox}>
            <Timer initialSeconds={180} accentColor={ACCENT} />
          </View>

          {isHost && (
            <Button
              label="End Game"
              onPress={handleEndGame}
              variant="ghost"
              accentColor={palette.danger}
              loading={ending}
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Ended ──────────────────────────────────────────────────

  if (game.status === "ended") {
    const impostorNames = game.impostorUids
      .map((uid) => sessionPlayers[uid]?.name)
      .filter((n): n is string => Boolean(n));

    if (isHost) {
      const picked = winnerSelection ?? game.winner ?? null;
      return (
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.phase}>Game Over</Text>
            <Text style={styles.title}>Round ended</Text>

            <View style={styles.wordReveal}>
              <Text style={styles.wordLabel}>The secret word was</Text>
              <Text style={styles.bigWord}>{game.secretWord}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {impostorNames.length === 1 ? "The Impostor" : "The Impostors"}
              </Text>
              {impostorNames.map((name) => (
                <View key={name} style={[styles.playerRow, { borderColor: ACCENT }]}>
                  <Text style={{ fontSize: 22 }}>🕵️</Text>
                  <Text style={[styles.playerName, { color: ACCENT }]}>{name}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Who won this round?</Text>
              {picked ? (
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerBadgeText}>
                    🏆 {picked === "crewmates" ? "Crewmates" : "Impostors"} win the round!
                  </Text>
                </View>
              ) : (
                <View style={styles.teamBtnRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.teamBtn,
                      { borderColor: palette.success },
                      pressed && { backgroundColor: palette.success + "22" },
                    ]}
                    onPress={() => handlePickWinner("crewmates")}
                  >
                    <Text style={{ fontSize: 28 }}>🎉</Text>
                    <Text style={[styles.teamBtnText, { color: palette.success }]}>
                      Crewmates
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.teamBtn,
                      { borderColor: ACCENT },
                      pressed && { backgroundColor: ACCENT + "22" },
                    ]}
                    onPress={() => handlePickWinner("impostors")}
                  >
                    <Text style={{ fontSize: 28 }}>🕵️</Text>
                    <Text style={[styles.teamBtnText, { color: ACCENT }]}>Impostors</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <Button
              label="Back to Hub"
              onPress={handleHostBackToHub}
              variant="ghost"
              accentColor={ACCENT}
              fullWidth
            />
          </ScrollView>
        </SafeAreaView>
      );
    }

    // Non-host ended view — live updates when host sets winner
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {game.winner ? (
            <>
              <Text style={styles.loading}>
                {game.winner === "crewmates" ? "🎉 Crewmates Win!" : "🕵️ Impostors Win!"}
              </Text>
              <Text style={styles.loadingHint}>The word was: {game.secretWord}</Text>
            </>
          ) : (
            <Text style={styles.loading}>Host is wrapping up…</Text>
          )}
          <Button
            label="Back to Hub"
            onPress={() => router.replace("/hub")}
            accentColor={ACCENT}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loading: { ...typography.heading2, color: palette.muted },
  loadingHint: { ...typography.caption, color: palette.border },
  phase: { ...typography.label, color: ACCENT, marginBottom: spacing.sm },
  title: { ...typography.heading1, color: palette.white, marginBottom: spacing.xl },

  roleSection: { marginBottom: spacing.xl },
  sectionLabel: { ...typography.label, color: palette.muted, marginBottom: spacing.md },
  roleContent: { alignItems: "center", gap: spacing.sm, padding: spacing.md },
  roleName: { ...typography.heading2, color: palette.white },
  roleWord: { ...typography.display, color: palette.white },
  roleTip: { ...typography.caption, color: palette.muted, textAlign: "center" },
  roleLoading: { ...typography.body, color: palette.muted },

  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  playerName: { ...typography.bodyBold, color: palette.white },
  youTag: { ...typography.caption, color: ACCENT },

  timerBox: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    marginTop: spacing.xl,
  },

  // Ended — host view
  section: { gap: spacing.md, marginBottom: spacing.xl },
  wordReveal: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  wordLabel: { ...typography.label, color: palette.muted },
  bigWord: { ...typography.display, color: palette.white },
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
  teamBtnText: { ...typography.heading3 } as any,
  winnerBadge: {
    backgroundColor: palette.warning + "22",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.warning,
    padding: spacing.md,
    alignItems: "center",
  },
  winnerBadgeText: { ...typography.bodyBold, color: palette.warning },
});
