import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { GAMES } from "../src/games/registry";
import { GameCard } from "../src/components/GameCard";
import { Button } from "../src/components/Button";
import { palette, spacing, typography } from "../src/theme";
import { usePlayerStore } from "../src/store/players";
import { useSessionStore } from "../src/store/session";
import { subscribeToSession, endOnlineSession, type SessionData } from "../src/firebase/sessions";
import { useGameIntro } from "../src/components/GameIntroOverlay";

const ACCENT = palette.wavelength;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function HubScreen() {
  const router = useRouter();
  const mode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const isHost = useSessionStore((s) => s.isHost);
  const myPlayerName = useSessionStore((s) => s.myPlayerName);
  const clearSession = useSessionStore((s) => s.clearSession);

  const players = usePlayerStore((s) => s.players);
  const addPlayer = usePlayerStore((s) => s.addPlayer);
  const removePlayer = usePlayerStore((s) => s.removePlayer);
  const resetAll = usePlayerStore((s) => s.resetAll);

  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  // Online session live data (non-host uses this for player list & game routing)
  const [liveSession, setLiveSession] = useState<SessionData | null>(null);
  const [pendingGame, setPendingGame] = useState<string | null>(null);

  const isFirstCallbackRef = useRef(true);
  const hasNavigatedToGameRef = useRef(false);

  const { showThen, overlay } = useGameIntro();

  // ── Online session subscription ────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "online" || !sessionCode) return;
    isFirstCallbackRef.current = true;
    hasNavigatedToGameRef.current = false;

    return subscribeToSession(sessionCode, (data: SessionData) => {
      if (data.ended) return; // handled globally by SessionEndWatcher in _layout.tsx

      setLiveSession(data);

      if (isHost) return; // host doesn't auto-navigate

      const game = data.currentGame;
      const isActive = game && data.gameStatus === "in-progress";

      if (isFirstCallbackRef.current) {
        isFirstCallbackRef.current = false;
        // Already in a game when we arrived — show a banner, don't auto-navigate
        if (isActive) setPendingGame(game);
        return;
      }

      // Game just started while we were waiting
      if (isActive && !hasNavigatedToGameRef.current) {
        hasNavigatedToGameRef.current = true;
        setPendingGame(null);
        navigateToGame(game);
      } else if (!game) {
        // Game ended — reset nav ref so we can navigate to the next one
        setPendingGame(null);
        hasNavigatedToGameRef.current = false;
      }
    });
  }, [mode, sessionCode, isHost]);

  // ── Navigation guard ───────────────────────────────────────────────────────
  if (!mode) return <Redirect href="/" />;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const navigateToGame = (gameId: string) => {
    const doNav = () => {
      switch (gameId) {
        case "impostor": router.push("/games/impostor/online/play"); break;
        case "wavelength": router.push("/games/wavelength/online" as any); break;
        case "taboo": router.push("/games/taboo/spectator" as any); break;
        default: router.push("/game-in-progress" as any); break;
      }
    };
    const def = GAMES.find((g) => g.id === gameId);
    if (def) showThen({ icon: def.icon, title: def.title, accentColor: def.accentColor }, doNav);
    else doNav();
  };

  const handleShareCode = () => {
    if (!sessionCode) return;
    Share.share({ message: `Join my Party Game! Session code: ${sessionCode}` });
  };

  const handleEndSession = () => {
    const doEnd = async () => {
      if (mode === "online" && isHost && sessionCode) {
        await endOnlineSession(sessionCode);
      }
      resetAll();
      clearSession();
      router.replace("/");
    };
    if (Platform.OS === "web") {
      if (window.confirm("End Session? This clears the roster, scores, and session.")) doEnd();
      return;
    }
    Alert.alert("End Session?", "This clears the roster, scores, and session. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "End Session", style: "destructive", onPress: doEnd },
    ]);
  };

  const handleLeaveSession = () => {
    const doLeave = () => { resetAll(); clearSession(); router.replace("/"); };
    if (Platform.OS === "web") {
      if (window.confirm("Leave this session?")) doLeave();
      return;
    }
    Alert.alert("Leave Session?", "You'll be taken back to the home screen.", [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: doLeave },
    ]);
  };

  // ── Host roster modal ──────────────────────────────────────────────────────
  const openModal = () => {
    setNameInput("");
    setNameError(null);
    setModalVisible(true);
  };

  const handleAddPlayer = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { setNameError("Enter a name."); return; }
    const isDuplicate = players.some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) { setNameError("That name is already in the roster."); return; }
    addPlayer(trimmed);
    setModalVisible(false);
  };

  const handleRemovePlayer = (id: string, name: string) => {
    if (Platform.OS === "web") {
      if (window.confirm(`Remove ${name} from the roster?`)) removePlayer(id);
      return;
    }
    Alert.alert("Remove player?", `Remove ${name} from the roster?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removePlayer(id) },
    ]);
  };

  // ── Online session player list (from Firestore) ────────────────────────────
  const hostName = liveSession?.hostName ?? null;
  const onlinePlayers = liveSession
    ? Object.entries(liveSession.players).map(([uid, p]) => ({
        uid,
        name: p.name,
        isHostPlayer: uid === liveSession.hostId,
      }))
    : null;

  // ════════════════════════════════════════════════════════════════════════════
  // NON-HOST ONLINE: waiting screen with live leaderboard
  // ════════════════════════════════════════════════════════════════════════════
  if (mode === "online" && !isHost) {
    // Merge online player list with local scores (UID-first, name fallback)
    const leaderboard = (onlinePlayers ?? [])
      .map(({ uid, name, isHostPlayer }) => {
        const local = players.find(
          (p) => p.firebaseUid === uid || p.name.toLowerCase() === name.toLowerCase()
        );
        return { uid, name, isHostPlayer, score: local?.totalScore ?? 0 };
      })
      .sort((a, b) => b.score - a.score);

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Session code — tap to share */}
          {sessionCode && (
            <Pressable onPress={handleShareCode} style={styles.codeBannerLarge}>
              <Text style={styles.codeBannerLabel}>SESSION CODE</Text>
              <Text style={styles.codeBannerValue}>{sessionCode}</Text>
              <Text style={styles.codeBannerHint}>tap to share</Text>
            </Pressable>
          )}

          {/* Pending game banner (already in progress when we joined) */}
          {pendingGame && (
            <Pressable
              style={styles.pendingBanner}
              onPress={() => {
                hasNavigatedToGameRef.current = true;
                setPendingGame(null);
                navigateToGame(pendingGame);
              }}
            >
              <Text style={styles.pendingBannerText}>
                🎮 {gameName(pendingGame)} is in progress — tap to watch
              </Text>
            </Pressable>
          )}

          {/* Waiting message */}
          <View style={styles.waitingCard}>
            <Text style={styles.waitingEmoji}>⏳</Text>
            <Text style={styles.waitingTitle}>
              {hostName ? `Waiting for ${hostName}` : "Waiting for the host"}
            </Text>
            <Text style={styles.waitingBody}>
              {hostName ? `${hostName} is choosing the next game…` : "The host is choosing the next game…"}
            </Text>
          </View>

          {/* Live leaderboard */}
          <View style={styles.rosterSection}>
            <Text style={styles.sectionLabel}>
              Leaderboard ({leaderboard.length} players)
            </Text>
            {leaderboard.length > 0 ? (
              <View style={styles.leaderboardList}>
                {leaderboard.map(({ uid, name, isHostPlayer, score }, i) => (
                  <View key={uid} style={[
                    styles.leaderboardRow,
                    i === 0 && score > 0 && styles.leaderboardRowFirst,
                  ]}>
                    <Text style={[styles.leaderboardRank, i === 0 && score > 0 && { color: palette.warning }]}>
                      {i === 0 && score > 0 ? "🥇" : i === 1 && score > 0 ? "🥈" : i === 2 && score > 0 ? "🥉" : `${i + 1}.`}
                    </Text>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(name)}</Text>
                    </View>
                    <Text style={styles.leaderboardName} numberOfLines={1}>{name}</Text>
                    <View style={styles.leaderboardRight}>
                      {isHostPlayer && (
                        <View style={styles.hostBadge}>
                          <Text style={styles.hostBadgeText}>HOST</Text>
                        </View>
                      )}
                      {name === myPlayerName && !isHostPlayer && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      )}
                      <Text style={[styles.leaderboardScore, i === 0 && score > 0 && { color: palette.warning }]}>
                        {score} {score === 1 ? "pt" : "pts"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Loading players…</Text>
            )}
          </View>

          <Button
            label="Leave Session"
            onPress={handleLeaveSession}
            variant="ghost"
            accentColor={palette.muted}
            fullWidth
            style={styles.endSessionBtn}
          />
        </ScrollView>

        {overlay}
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HOST (or offline): full hub with game grid
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>🎉 Party Games</Text>
            <Text style={styles.subtitle}>Pick a game to play next</Text>
          </View>
          {mode === "online" && sessionCode && (
            <Pressable onPress={handleShareCode} style={styles.codeBadge}>
              <Text style={styles.codeLabel}>SESSION CODE</Text>
              <Text style={styles.codeValue}>{sessionCode}</Text>
              <Text style={styles.codeShareHint}>tap to share</Text>
            </Pressable>
          )}
        </View>

        {/* Player roster */}
        <View style={styles.rosterSection}>
          <View style={styles.rosterHeader}>
            <Text style={styles.sectionLabel}>Players</Text>
            <View style={styles.rosterActions}>
              {mode === "offline" && (
                <Pressable onPress={openModal}>
                  <Text style={styles.editLink}>+ Add</Text>
                </Pressable>
              )}
              <Pressable onPress={() => router.push("/standings")}>
                <Text style={styles.editLink}>Standings</Text>
              </Pressable>
            </View>
          </View>

          {/* Online mode: show live Firestore players */}
          {mode === "online" && onlinePlayers ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {onlinePlayers.map(({ uid, name, isHostPlayer }) => (
                <Pressable
                  key={uid}
                  style={({ pressed }) => [styles.playerChip, pressed && styles.chipPressed]}
                  onPress={() => isHost && handleRemovePlayer(uid, name)}
                  disabled={!isHost}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(name)}</Text>
                  </View>
                  <View>
                    <View style={styles.nameRow}>
                      <Text style={styles.playerChipName} numberOfLines={1}>{name}</Text>
                      {isHostPlayer && (
                        <View style={styles.hostBadge}>
                          <Text style={styles.hostBadgeText}>HOST</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            // Offline mode: show local Zustand players
            players.length === 0 ? (
              <Text style={styles.emptyText}>No players yet.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {players.map((p) => (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [styles.playerChip, pressed && styles.chipPressed]}
                    onPress={() => handleRemovePlayer(p.id, p.name)}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(p.name)}</Text>
                    </View>
                    <View>
                      <Text style={styles.playerChipName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.playerScore}>{p.totalScore} pts</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )
          )}
        </View>

        {/* Game cards */}
        <View style={styles.gameList}>
          {GAMES.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPress={() => {
                if (game.status === "available") {
                  router.push(game.route as any);
                }
              }}
            />
          ))}
        </View>

        <Text style={styles.footer}>More games coming soon ✦</Text>

        <Button
          label="End Session"
          onPress={handleEndSession}
          variant="ghost"
          accentColor={palette.muted}
          fullWidth
          style={styles.endSessionBtn}
        />
      </ScrollView>

      {overlay}

      {/* Add Player modal (host / offline only) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalBackdropTap} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Player</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={(v) => { setNameInput(v); if (nameError) setNameError(null); }}
              placeholder="Player name"
              placeholderTextColor={palette.border}
              maxLength={20}
              autoFocus
              onSubmitEditing={handleAddPlayer}
            />
            {nameError && <Text style={styles.modalError}>{nameError}</Text>}
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                onPress={() => setModalVisible(false)}
                variant="secondary"
                accentColor={ACCENT}
                style={styles.modalBtn}
              />
              <Button
                label="Add"
                onPress={handleAddPlayer}
                accentColor={ACCENT}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function gameName(game: string): string {
  switch (game) {
    case "impostor": return "Impostor";
    case "wavelength": return "Wavelength";
    case "taboo": return "Taboo";
    default: return "A game";
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  // ── Shared header & roster ─────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  appName: { ...typography.heading1, color: palette.white, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: palette.muted },
  codeBadge: {
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  codeLabel: { ...typography.label, color: palette.muted, fontSize: 9 },
  codeValue: { fontSize: 20, fontWeight: "900", color: ACCENT, letterSpacing: 4 },
  codeShareHint: { ...typography.label, color: palette.muted, fontSize: 8, marginTop: 2 },

  rosterSection: { marginBottom: spacing.xl },
  rosterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionLabel: { ...typography.label, color: palette.muted },
  rosterActions: { flexDirection: "row", gap: spacing.md },
  editLink: { ...typography.caption, color: ACCENT, fontWeight: "700" },
  emptyText: { ...typography.body, color: palette.muted },
  chipRow: { gap: spacing.sm, paddingRight: spacing.sm },
  playerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: palette.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 180,
  },
  chipPressed: { opacity: 0.7 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...typography.caption, color: ACCENT, fontSize: 11 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  playerChipName: { ...typography.bodyBold, color: palette.white, flexShrink: 1 },
  playerScore: { ...typography.caption, color: palette.muted },

  // ── Host / You badges ──────────────────────────────────────────────────────
  badgeRow: { flexDirection: "row", gap: spacing.xs },
  hostBadge: {
    backgroundColor: palette.warning + "33",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.warning,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  hostBadgeText: { fontSize: 8, fontWeight: "800", color: palette.warning, letterSpacing: 0.5 },
  youBadge: {
    backgroundColor: ACCENT + "22",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  youBadgeText: { fontSize: 8, fontWeight: "800", color: ACCENT, letterSpacing: 0.5 },

  // ── Host game grid ─────────────────────────────────────────────────────────
  gameList: { gap: spacing.sm },
  footer: {
    ...typography.caption,
    color: palette.border,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
  endSessionBtn: { marginTop: spacing.xl },

  // ── Non-host waiting screen ────────────────────────────────────────────────
  codeBannerLarge: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: ACCENT,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  codeBannerLabel: { ...typography.label, color: palette.muted },
  codeBannerValue: { fontSize: 36, fontWeight: "900", color: ACCENT, letterSpacing: 6 },
  codeBannerHint: { ...typography.caption, color: palette.muted, marginTop: spacing.xs },

  pendingBanner: {
    backgroundColor: palette.wavelength + "22",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.wavelength,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  pendingBannerText: { ...typography.bodyBold, color: palette.wavelength, textAlign: "center" },

  waitingCard: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  waitingEmoji: { fontSize: 48 },
  waitingTitle: { ...typography.heading2, color: palette.white },
  waitingBody: { ...typography.body, color: palette.muted, textAlign: "center" },

  onlinePlayerList: { gap: spacing.sm },
  onlinePlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  onlinePlayerName: { ...typography.bodyBold, color: palette.white, flex: 1 },

  // Leaderboard (non-host waiting screen)
  leaderboardList: { gap: spacing.sm },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  leaderboardRowFirst: {
    borderColor: palette.warning + "88",
    backgroundColor: palette.warning + "0D",
  },
  leaderboardRank: {
    ...typography.bodyBold,
    color: palette.muted,
    width: 32,
    textAlign: "center" as const,
  },
  leaderboardName: { ...typography.bodyBold, color: palette.white, flex: 1 },
  leaderboardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  leaderboardScore: {
    ...typography.bodyBold,
    color: palette.muted,
    minWidth: 44,
    textAlign: "right" as const,
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "flex-end",
  },
  modalBackdropTap: { flex: 1 },
  modalCard: {
    backgroundColor: palette.bgCardElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  modalTitle: { ...typography.heading2, color: palette.white },
  modalInput: {
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.white,
    ...typography.body,
  },
  modalError: { ...typography.caption, color: palette.danger },
  modalActions: { flexDirection: "row", gap: spacing.md },
  modalBtn: { flex: 1 },

});
