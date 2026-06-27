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
import { palette, spacing, typography, shadows } from "../src/theme";
import { usePlayerStore } from "../src/store/players";
import { useSessionStore } from "../src/store/session";
import {
  subscribeToSession,
  endOnlineSession,
  kickPlayer,
  setPendingRemoval,
  clearPendingRemoval,
  clearReturnedToLobby,
  type SessionData,
} from "../src/firebase/sessions";
import { auth } from "../src/firebase/config";
import { PartyIcon } from "../src/assets/icons/PartyIcon";
import { HourglassIcon } from "../src/assets/icons/HourglassIcon";
import { MedalIcon } from "../src/assets/icons/MedalIcon";
import { SparkleIcon } from "../src/assets/icons/SparkleIcon";
import { XIcon } from "../src/assets/icons/XIcon";
const ACCENT = palette.wavelength;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function displayName(name: string): string {
  return name.length > 8 ? name.slice(0, 8) + "…" : name;
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

  const [pendingKick, setPendingKick] = useState<{ uid: string; name: string } | null>(null);
  const pendingKickRef = useRef<string | null>(null);
  const pendingKickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [returnedToLobbyPlayer, setReturnedToLobbyPlayer] = useState<{ uid: string; name: string } | null>(null);
  const returnedToLobbyRef = useRef<string | null>(null);

  // ── Online session subscription ────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "online" || !sessionCode) return;

    return subscribeToSession(sessionCode, (data: SessionData) => {
      if (data.ended) return; // handled globally by SessionEndWatcher in _layout.tsx

      // Kick detection: non-host was removed from session
      const currentUid = auth.currentUser?.uid;
      if (!isHost && currentUid && data.players && !data.players[currentUid]) {
        resetAll();
        clearSession();
        Alert.alert("Removed", "You have been removed from the session.", [
          { text: "OK", onPress: () => router.replace("/") },
        ]);
        return;
      }

      setLiveSession(data);

      if (isHost) {
        // Check for a player with pendingRemoval to show the kick banner
        const pending = Object.entries(data.players).find(
          ([uid, p]) => p.pendingRemoval && uid !== data.hostId
        );
        if (pending) {
          const [uid, p] = pending;
          if (uid !== pendingKickRef.current) {
            pendingKickRef.current = uid;
            setPendingKick({ uid, name: p.name });
          }
        } else if (pendingKickRef.current) {
          pendingKickRef.current = null;
          setPendingKick(null);
        }

        // Check for a player who returned to lobby mid-game
        const returned = Object.entries(data.players).find(
          ([uid, p]) => p.returnedToLobby && uid !== data.hostId
        );
        if (returned) {
          const [uid, p] = returned;
          if (uid !== returnedToLobbyRef.current) {
            returnedToLobbyRef.current = uid;
            setReturnedToLobbyPlayer({ uid, name: p.name });
          }
        } else if (returnedToLobbyRef.current) {
          returnedToLobbyRef.current = null;
          setReturnedToLobbyPlayer(null);
        }

        return;
      }

    });
  }, [mode, sessionCode, isHost]);

  // Auto-dismiss kick banner after 15 seconds (Keep behaviour)
  useEffect(() => {
    if (!pendingKick) return;
    if (pendingKickTimerRef.current) clearTimeout(pendingKickTimerRef.current);
    pendingKickTimerRef.current = setTimeout(async () => {
      if (sessionCode && pendingKick) {
        try { await clearPendingRemoval(sessionCode, pendingKick.uid); } catch {}
      }
      pendingKickRef.current = null;
      setPendingKick(null);
    }, 15000);
    return () => {
      if (pendingKickTimerRef.current) clearTimeout(pendingKickTimerRef.current);
    };
  }, [pendingKick?.uid]);

  // Auto-dismiss "returned to lobby" toast after 4 seconds
  useEffect(() => {
    if (!returnedToLobbyPlayer) return;
    const timer = setTimeout(async () => {
      if (sessionCode) {
        try { await clearReturnedToLobby(sessionCode, returnedToLobbyPlayer.uid); } catch {}
      }
      returnedToLobbyRef.current = null;
      setReturnedToLobbyPlayer(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [returnedToLobbyPlayer?.uid]);

  // ── Navigation guard ───────────────────────────────────────────────────────
  if (!mode) return <Redirect href="/" />;

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
    const doLeave = async () => {
      const uid = auth.currentUser?.uid;
      if (sessionCode && uid) {
        try { await setPendingRemoval(sessionCode, uid); } catch {}
      }
      resetAll();
      clearSession();
      router.replace("/");
    };
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

  const handleKickOnlinePlayer = (uid: string, name: string) => {
    Alert.alert("Remove player?", `Remove ${name} from the session?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!sessionCode) return;
          try {
            const result = await kickPlayer(sessionCode, uid);
            if (result.gameEnded) Alert.alert("Game ended", "Not enough players to continue.");
          } catch (e: any) {
            Alert.alert("Error", e.message ?? "Could not remove player.");
          }
        },
      },
    ]);
  };

  const handlePlayerPress = (uid: string, name: string, isHostPlayer: boolean) => {
    if (!isHost || isHostPlayer) return;
    Alert.alert(
      name,
      undefined,
      [
        {
          text: "Kick player",
          style: "destructive",
          onPress: async () => {
            if (!sessionCode) return;
            try {
              const result = await kickPlayer(sessionCode, uid);
              if (result.gameEnded) Alert.alert("Game ended", "Not enough players to continue.");
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "Could not remove player.");
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
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

          {/* Waiting message */}
          <View style={styles.waitingCard}>
            <HourglassIcon size={48} />
            <Text style={styles.waitingTitle}>
              {liveSession?.gameStatus === "in-progress" ? "Game in progress" : (hostName ? `Waiting for ${hostName}` : "Waiting for the host")}
            </Text>
            <Text style={styles.waitingBody}>
              {liveSession?.gameStatus === "in-progress"
                ? "The lobby is currently in a game. You'll join automatically when it ends."
                : (hostName ? `${hostName} is choosing the next game…` : "The host is choosing the next game…")}
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
                    <View style={{ width: 32, alignItems: "center", justifyContent: "center" }}>
                      {i === 0 && score > 0 ? (
                        <MedalIcon rank={1} size={26} />
                      ) : i === 1 && score > 0 ? (
                        <MedalIcon rank={2} size={26} />
                      ) : i === 2 && score > 0 ? (
                        <MedalIcon rank={3} size={26} />
                      ) : (
                        <Text style={styles.leaderboardRank}>{i + 1}.</Text>
                      )}
                    </View>
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

          <Text style={styles.waitingSubtitle}>
            Questions?{'  /  '}
            <Text style={styles.helpLink} onPress={() => router.push("/info")}>How to play</Text>
          </Text>

          <Button
            label="Leave Session"
            onPress={handleLeaveSession}
            variant="ghost"
            accentColor={palette.muted}
            fullWidth
            style={styles.endSessionBtn}
          />
        </ScrollView>

      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HOST (or offline): full hub with game grid
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safe}>
      {pendingKick && (
        <View style={styles.kickBanner}>
          <Text style={styles.kickBannerTitle}>
            {pendingKick.name} left the session
          </Text>
          <Text style={styles.kickBannerSubtitle}>
            Remove them to clear them from the leaderboard and future games, or keep them in case they rejoin.
          </Text>
          <View style={styles.kickBannerButtons}>
            <Pressable
              style={styles.kickBannerRemove}
              onPress={async () => {
                const { uid } = pendingKick;
                pendingKickRef.current = null;
                setPendingKick(null);
                if (!sessionCode) return;
                try {
                  const result = await kickPlayer(sessionCode, uid);
                  if (result.gameEnded) Alert.alert("Game ended", "Not enough players to continue.");
                } catch {}
              }}
            >
              <Text style={styles.kickBannerRemoveText}>Remove from session</Text>
            </Pressable>
            <Pressable
              style={styles.kickBannerKeep}
              onPress={async () => {
                const { uid } = pendingKick;
                pendingKickRef.current = null;
                setPendingKick(null);
                if (sessionCode) try { await clearPendingRemoval(sessionCode, uid); } catch {}
              }}
            >
              <Text style={styles.kickBannerKeepText}>Keep (they may rejoin)</Text>
            </Pressable>
          </View>
        </View>
      )}
      {returnedToLobbyPlayer && (
        <View style={styles.returnedToast}>
          <Text style={styles.returnedToastText}>
            {returnedToLobbyPlayer.name} has returned to the lobby
          </Text>
        </View>
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <PartyIcon size={24} />
              <Text style={styles.appName}>PartyFrenzy</Text>
            </View>
            <Text style={styles.subtitle}>
              Pick a game to play next{'  /  '}
              <Text style={styles.helpLink} onPress={() => router.push("/info")}>Help</Text>
            </Text>
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
                  onPress={() => handlePlayerPress(uid, name, isHostPlayer)}
                  disabled={!isHost}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(name)}</Text>
                  </View>
                  <View>
                    <Text style={styles.playerChipName}>{displayName(name)}</Text>
                    {isHostPlayer && (
                      <View style={styles.hostBadge}>
                        <Text style={styles.hostBadgeText}>HOST</Text>
                      </View>
                    )}
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
                      <Text style={styles.playerChipName}>{displayName(p.name)}</Text>
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

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.xxl }}>
          <SparkleIcon size={14} />
          <Text style={styles.footer}>More games coming soon</Text>
        </View>

        <Button
          label="End Session"
          onPress={handleEndSession}
          variant="ghost"
          accentColor={palette.muted}
          fullWidth
          style={styles.endSessionBtn}
        />
      </ScrollView>

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
  appName: { ...typography.heading1, fontFamily: "HennyPenny_400Regular", color: palette.white, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: palette.muted },
  helpLink: { color: "#4FC3F7", textDecorationLine: "underline" as const },
  waitingSubtitle: { color: "#888", fontSize: 14, textAlign: "center", marginTop: 16, marginBottom: 8 },
  codeBadge: {
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    marginRight: spacing.sm,
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
    ...shadows.sm,
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
  },
  endSessionBtn: { marginTop: spacing.xl },

  // ── Kick notification banner ───────────────────────────────────────────────
  kickBanner: {
    position: "absolute" as const,
    bottom: 32,
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: "#1a0010",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FF2D78",
    padding: 16,
    gap: spacing.sm,
  },
  kickBannerTitle: { ...typography.bodyBold, color: palette.white },
  kickBannerSubtitle: { fontSize: 13, color: "#FFB3CC", lineHeight: 18 },
  kickBannerButtons: { gap: spacing.sm, marginTop: spacing.xs },
  kickBannerRemove: {
    backgroundColor: "#FF2D78",
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center" as const,
  },
  kickBannerRemoveText: { ...typography.bodyBold, color: palette.white },
  kickBannerKeep: {
    backgroundColor: "transparent",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF2D78" + "66",
    paddingVertical: spacing.md,
    alignItems: "center" as const,
  },
  kickBannerKeepText: { ...typography.body, color: "#FFB3CC" },

  // ── Returned-to-lobby toast ────────────────────────────────────────────────
  returnedToast: {
    position: "absolute" as const,
    bottom: 32,
    alignSelf: "center" as const,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 999,
  },
  returnedToastText: { ...typography.body, color: palette.white },

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

  waitingCard: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
    ...shadows.md,
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
  leaderboardList: { gap: spacing.sm, marginTop: spacing.md },
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
    ...shadows.lg,
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
