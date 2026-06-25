import React, { useState, useEffect, useRef } from "react";
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
import { ensureAnonymousAuth } from "../../../../src/firebase/rooms";
import {
  subscribeToSession,
  subscribeToImpostorRole,
  startImpostorVoting,
  submitImpostorVote,
  revealImpostorResult,
  clearImpostorSession,
  clearSessionCurrentGame,
  setReturnedToLobby,
  kickPlayer,
  clearPendingRemoval,
  type SessionData,
} from "../../../../src/firebase/sessions";
import { LeaveGameDialog } from "../../../../src/components/LeaveGameDialog";
import { KickPlayerModal } from "../../../../src/components/KickPlayerModal";
import { BackButton } from "../../../../src/components/BackButton";
import { ExitGameDialog } from "../../../../src/components/ExitGameDialog";
import { useSessionStore } from "../../../../src/store/session";
import { usePlayerStore } from "../../../../src/store/players";
import type { PlayerRole } from "../../../../src/games/impostor/types";
import { ImpostorIcon } from "../../../../src/assets/icons/ImpostorIcon";
import { CrewmateIcon } from "../../../../src/assets/icons/CrewmateIcon";
import { CheckIcon } from "../../../../src/assets/icons/CheckIcon";
import { BallotIcon } from "../../../../src/assets/icons/BallotIcon";
import { HandshakeIcon } from "../../../../src/assets/icons/HandshakeIcon";

const ACCENT = palette.impostor;

interface MyRole {
  role: PlayerRole;
  word?: string;
}

function computeEliminationResult(
  votes: Record<string, string>,
  impostorUids: string[]
): { eliminatedPlayerId: string | null; impostorCaught: boolean; isTie: boolean } {
  const counts: Record<string, number> = {};
  for (const targetId of Object.values(votes)) {
    counts[targetId] = (counts[targetId] ?? 0) + 1;
  }
  if (Object.keys(counts).length === 0) {
    return { eliminatedPlayerId: null, impostorCaught: false, isTie: true };
  }
  const maxVotes = Math.max(...Object.values(counts));
  const leaders = Object.entries(counts)
    .filter(([, c]) => c === maxVotes)
    .map(([id]) => id);
  if (leaders.length > 1) {
    return { eliminatedPlayerId: null, impostorCaught: false, isTie: true };
  }
  const eliminatedPlayerId = leaders[0];
  return {
    eliminatedPlayerId,
    impostorCaught: impostorUids.includes(eliminatedPlayerId),
    isTie: false,
  };
}

export default function OnlinePlayScreen() {
  const router = useRouter();
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const isHost = useSessionStore((s) => s.isHost);
  const scoringMode = useSessionStore((s) => s.scoringMode);

  const localPlayers = usePlayerStore((s) => s.players);
  const addPoints = usePlayerStore((s) => s.addPoints);
  const linkFirebaseUid = usePlayerStore((s) => s.linkFirebaseUid);

  const [session, setSession] = useState<SessionData | null>(null);
  const [myRole, setMyRole] = useState<MyRole | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  // App-mode: which player this device tapped before submitting
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);
  // Host-decides: which player the host has tapped
  const [hostPickedUid, setHostPickedUid] = useState<string | null>(null);

  // Points earned this reveal (for display)
  const [myPtsEarned, setMyPtsEarned] = useState(0);

  const scoredRevealRef = useRef(false);
  const revealedRef = useRef(false);
  const hadGameRef = useRef(false);

  // Resolve Firebase UID
  useEffect(() => {
    ensureAnonymousAuth().then((user) => setMyUid(user.uid));
  }, []);

  // Subscribe to session document
  useEffect(() => {
    if (!sessionCode) return;
    return subscribeToSession(sessionCode, (data) => {
      if (myUid && !data.players[myUid]) {
        Alert.alert("Removed", "You have been removed from the session.", [
          { text: "OK", onPress: () => router.replace("/") },
        ]);
        return;
      }
      setSession(data);
    });
  }, [sessionCode, myUid]);

  // Subscribe to own private role doc
  useEffect(() => {
    if (!sessionCode || !myUid) return;
    return subscribeToImpostorRole(sessionCode, myUid, (role) => {
      if (role) setMyRole(role);
    });
  }, [sessionCode, myUid]);

  const game = session?.impostorGame;
  const sessionPlayers = session?.players ?? {};

  // Auto-advance to reveal when all votes are in (host only, app mode)
  useEffect(() => {
    if (
      !isHost ||
      !game ||
      game.status !== "voting" ||
      game.votingMode !== "app" ||
      revealedRef.current
    )
      return;
    const currentVotes = game.votes ?? {};
    const playerCount = Object.keys(sessionPlayers).length;
    if (playerCount > 0 && Object.keys(currentVotes).length >= playerCount) {
      revealedRef.current = true;
      const { eliminatedPlayerId, impostorCaught } = computeEliminationResult(
        currentVotes,
        game.impostorUids
      );
      revealImpostorResult(
        sessionCode!,
        eliminatedPlayerId,
        impostorCaught,
        currentVotes
      ).catch(() => {});
    }
  }, [game?.votes, game?.status]);

  // Score each player locally when reveal fires
  useEffect(() => {
    if (!game || game.status !== "reveal" || !myUid || scoredRevealRef.current) return;
    scoredRevealRef.current = true;

    const isImpostor = game.impostorUids.includes(myUid);
    const caught = game.impostorCaught ?? false;
    const eliminated = game.eliminatedPlayerId;
    const votes = game.votes ?? {};
    const vMode = game.votingMode ?? "app";

    let pts = 0;
    if (isImpostor && !caught) {
      pts = scoringMode === "extended" ? 4 : 1;
    } else if (!isImpostor && caught) {
      const votedCorrectly = vMode === "host" || votes[myUid] === eliminated;
      if (votedCorrectly) {
        pts = scoringMode === "extended" ? 3 : 1;
      }
    }

    setMyPtsEarned(pts);

    if (pts > 0) {
      const myName = sessionPlayers[myUid]?.name;
      let local = localPlayers.find((p) => p.firebaseUid === myUid);
      if (!local) {
        local = localPlayers.find(
          (p) => p.name.toLowerCase() === (myName ?? "").toLowerCase()
        );
        if (local) linkFirebaseUid(local.id, myUid);
      }
      if (local) addPoints(local.id, pts);
    }
  }, [game?.status]);

  // ── Handlers ───────────────────────────────────────────────

  const handleStartVoting = () => {
    Alert.alert("End Discussion", "Move everyone to the voting phase?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start Voting",
        onPress: async () => {
          setBusy(true);
          try {
            await startImpostorVoting(sessionCode!);
          } catch (e: any) {
            Alert.alert("Error", e.message);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const handleSubmitVote = async () => {
    if (!myUid || !selectedVoteTarget) return;
    setBusy(true);
    try {
      await submitImpostorVote(sessionCode!, myUid, selectedVoteTarget);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCloseVoting = async () => {
    if (!game) return;
    const currentVotes = game.votes ?? {};
    const { eliminatedPlayerId, impostorCaught } = computeEliminationResult(
      currentVotes,
      game.impostorUids
    );
    setBusy(true);
    try {
      await revealImpostorResult(
        sessionCode!,
        eliminatedPlayerId,
        impostorCaught,
        currentVotes
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmElimination = async () => {
    if (!game || !hostPickedUid) return;
    const impostorCaught = game.impostorUids.includes(hostPickedUid);
    setBusy(true);
    try {
      await revealImpostorResult(sessionCode!, hostPickedUid, impostorCaught, {});
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleNonHostLeave = async () => {
    setShowExitDialog(false);
    if (sessionCode && myUid) {
      try { await setReturnedToLobby(sessionCode, myUid); } catch {}
    }
    router.replace("/hub");
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

  // ── Exit / leave / kick UI ────────────────────────────────

  const exitDialog = isHost ? (
    <ExitGameDialog
      visible={showExitDialog}
      onKeepScores={handleHostBackToHub}
      onVoidPoints={handleHostBackToHub}
      onCancel={() => setShowExitDialog(false)}
    />
  ) : (
    <LeaveGameDialog
      visible={showExitDialog}
      onLeave={handleNonHostLeave}
      onCancel={() => setShowExitDialog(false)}
    />
  );

  const backBtn = <BackButton onPress={() => setShowExitDialog(true)} color={ACCENT} />;

  const handleKickFromModal = async (uid: string) => {
    setShowPlayerModal(false);
    if (!sessionCode) return;
    try {
      const result = await kickPlayer(sessionCode, uid);
      if (result.gameEnded) Alert.alert("Game ended", "Not enough players to continue.");
    } catch {}
  };

  const pendingKickEntry = isHost
    ? Object.entries(sessionPlayers).find(([uid, p]) => p.pendingRemoval && uid !== session?.hostId)
    : null;

  const kickBannerNode = pendingKickEntry ? (
    <View style={styles.kickBanner}>
      <Text style={styles.kickBannerText} numberOfLines={1}>
        {pendingKickEntry[1].name} left the game
      </Text>
      <Pressable
        style={styles.kickBannerRemove}
        onPress={() => handleKickFromModal(pendingKickEntry[0])}
      >
        <Text style={styles.kickBannerBtnText}>Remove</Text>
      </Pressable>
      <Pressable
        style={styles.kickBannerKeep}
        onPress={async () => {
          if (sessionCode) try { await clearPendingRemoval(sessionCode, pendingKickEntry[0]); } catch {}
        }}
      >
        <Text style={styles.kickBannerBtnText}>Keep</Text>
      </Pressable>
    </View>
  ) : null;

  const kickModal = (
    <KickPlayerModal
      visible={showPlayerModal}
      players={Object.entries(sessionPlayers).map(([uid, p]) => ({ uid, name: p.name }))}
      myUid={myUid}
      onKick={handleKickFromModal}
      onClose={() => setShowPlayerModal(false)}
    />
  );

  const playersBtn = isHost ? (
    <Pressable style={styles.playersBtn} onPress={() => setShowPlayerModal(true)}>
      <CrewmateIcon size={20} />
    </Pressable>
  ) : null;

  // ── Loading / blank for post-game ─────────────────────────

  if (game !== null && game !== undefined) hadGameRef.current = true;

  if (!session || !game) {
    if (hadGameRef.current) return null;
    return (
      <SafeAreaView style={styles.safe}>
        {exitDialog}
        {kickModal}
        <View style={styles.center}>
          <Text style={styles.loading}>Connecting…</Text>
        </View>
        {backBtn}
      </SafeAreaView>
    );
  }

  // ── Discussion ─────────────────────────────────────────────

  if (game.status === "discussion") {
    // Derive role from game state if role doc subscription hasn't fired yet.
    // game.impostorUids and game.secretWord are already in the session doc every
    // device receives, so this is no less private than the role doc approach.
    const isImpostorDerived = myUid ? game.impostorUids.includes(myUid) : null;
    const effectiveRole: MyRole | null = myRole ?? (isImpostorDerived !== null
      ? {
          role: isImpostorDerived ? "impostor" : "crewmate",
          word: isImpostorDerived ? undefined : game.secretWord,
        }
      : null);

    return (
      <SafeAreaView style={styles.safe}>
        {exitDialog}
        {kickModal}
        {kickBannerNode}
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.phase}>Discussion Phase</Text>
          <Text style={styles.title}>Time to talk!</Text>

          <View style={styles.roleSection}>
            <Text style={styles.sectionLabel}>Your role</Text>
            {effectiveRole ? (
              <HoldToReveal accentColor={ACCENT}>
                {effectiveRole.role === "impostor" ? (
                  <View style={styles.roleContent}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <ImpostorIcon size={28} />
                      <Text style={styles.roleName}>You are the Impostor</Text>
                    </View>
                    <Text style={styles.roleTip}>You have NO word. Listen and bluff!</Text>
                  </View>
                ) : (
                  <View style={styles.roleContent}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <CrewmateIcon size={28} />
                      <Text style={styles.roleName}>Crewmate</Text>
                    </View>
                    <Text style={styles.roleWord}>{effectiveRole.word}</Text>
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
              {uid === myUid && <Text style={styles.youTag}>You</Text>}
            </View>
          ))}

          <View style={styles.timerBox}>
            <Timer initialSeconds={180} accentColor={ACCENT} />
          </View>

          {isHost && (
            <Button
              label="Start Voting →"
              onPress={handleStartVoting}
              accentColor={ACCENT}
              loading={busy}
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          )}
        </ScrollView>
        {backBtn}
        {playersBtn}
      </SafeAreaView>
    );
  }

  // ── Voting ─────────────────────────────────────────────────

  if (game.status === "voting") {
    const votes = game.votes ?? {};
    const voteCount = Object.keys(votes).length;
    const totalPlayers = Object.keys(sessionPlayers).length;
    const myVoteSubmitted = myUid ? !!votes[myUid] : false;

    // Host-decides mode
    if (game.votingMode === "host") {
      if (isHost) {
        return (
          <SafeAreaView style={styles.safe}>
            {exitDialog}
            {kickModal}
            {kickBannerNode}
            <ScrollView contentContainerStyle={styles.container}>
              <Text style={styles.phase}>Voting Phase</Text>
              <Text style={styles.title}>Who is eliminated?</Text>
              <Text style={styles.subtitle}>
                Tap the player the group voted to eliminate.
              </Text>

              <View style={styles.voteList}>
                {Object.entries(sessionPlayers).map(([uid, { name }]) => {
                  const picked = uid === hostPickedUid;
                  return (
                    <Pressable
                      key={uid}
                      style={[
                        styles.voteRow,
                        picked && { borderColor: ACCENT, backgroundColor: ACCENT + "18" },
                      ]}
                      onPress={() => setHostPickedUid(uid)}
                    >
                      <Text style={[styles.voteRowName, picked && { color: ACCENT }]}>
                        {name}
                      </Text>
                      {uid === myUid && <Text style={styles.youTag}>You</Text>}
                      {picked && <CheckIcon size={18} color={ACCENT} />}
                    </Pressable>
                  );
                })}
              </View>

              <Button
                label="Confirm Elimination"
                onPress={handleConfirmElimination}
                accentColor={ACCENT}
                loading={busy}
                disabled={!hostPickedUid}
                fullWidth
                style={{ marginTop: spacing.lg }}
              />
            </ScrollView>
            {playersBtn}
          </SafeAreaView>
        );
      }

      // Non-host waiting (host mode)
      return (
        <SafeAreaView style={styles.safe}>
          {exitDialog}
          {kickModal}
          <View style={styles.center}>
            <BallotIcon size={56} />
            <Text style={styles.waitTitle}>Voting in Progress</Text>
            <Text style={styles.waitSubtitle}>
              Waiting for the host to submit the result…
            </Text>
          </View>
          {backBtn}
        </SafeAreaView>
      );
    }

    // App mode — vote not yet submitted
    if (!myVoteSubmitted) {
      const othersEntries = Object.entries(sessionPlayers).filter(
        ([uid]) => uid !== myUid
      );
      return (
        <SafeAreaView style={styles.safe}>
          {exitDialog}
          {kickModal}
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.phase}>Voting Phase</Text>
            <Text style={styles.title}>Who is the impostor?</Text>
            <Text style={styles.subtitle}>Tap to select, then submit your vote.</Text>

            <View style={styles.voteList}>
              {othersEntries.map(([uid, { name }]) => {
                const picked = uid === selectedVoteTarget;
                return (
                  <Pressable
                    key={uid}
                    style={[
                      styles.voteRow,
                      picked && { borderColor: ACCENT, backgroundColor: ACCENT + "18" },
                    ]}
                    onPress={() => setSelectedVoteTarget(uid)}
                  >
                    <Text style={[styles.voteRowName, picked && { color: ACCENT }]}>
                      {name}
                    </Text>
                    {picked && <CheckIcon size={18} color={ACCENT} />}
                  </Pressable>
                );
              })}
            </View>

            <Button
              label="Submit Vote"
              onPress={handleSubmitVote}
              accentColor={ACCENT}
              loading={busy}
              disabled={!selectedVoteTarget}
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          </ScrollView>
          {backBtn}
        </SafeAreaView>
      );
    }

    // App mode — waiting for others after vote submitted
    return (
      <SafeAreaView style={styles.safe}>
        {exitDialog}
        {kickModal}
        <View style={styles.center}>
          <CheckIcon size={56} />
          <Text style={styles.waitTitle}>Vote submitted!</Text>
          <Text style={styles.waitSubtitle}>
            {voteCount} of {totalPlayers} votes in…
          </Text>
          {isHost && (
            <Button
              label="Close Voting"
              onPress={handleCloseVoting}
              variant="ghost"
              accentColor={ACCENT}
              loading={busy}
              style={{ marginTop: spacing.xl }}
            />
          )}
        </View>
        {backBtn}
      </SafeAreaView>
    );
  }

  // ── Reveal ─────────────────────────────────────────────────

  if (game.status === "reveal") {
    const eliminated = game.eliminatedPlayerId;
    const caught = game.impostorCaught ?? false;
    const isTie = eliminated === null;
    const impostorNames = game.impostorUids
      .map((uid) => sessionPlayers[uid]?.name)
      .filter((n): n is string => Boolean(n));

    const voteTally =
      game.votingMode === "app"
        ? Object.entries(sessionPlayers)
            .map(([uid, { name }]) => ({
              uid,
              name,
              count: Object.values(game.votes ?? {}).filter((v) => v === uid).length,
            }))
            .sort((a, b) => b.count - a.count)
        : [];

    return (
      <SafeAreaView style={styles.safe}>
        {exitDialog}
        {kickModal}
        {kickBannerNode}
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.phase}>Results</Text>

          {/* Outcome banner */}
          <View
            style={[
              styles.outcomeBanner,
              isTie
                ? { borderColor: palette.warning, backgroundColor: palette.warning + "18" }
                : caught
                ? { borderColor: palette.success, backgroundColor: palette.success + "18" }
                : { borderColor: ACCENT, backgroundColor: ACCENT + "18" },
            ]}
          >
            <View>
              {isTie ? <HandshakeIcon size={56} /> : caught ? <CrewmateIcon size={56} /> : <ImpostorIcon size={56} />}
            </View>
            <Text
              style={[
                styles.outcomeTitle,
                isTie
                  ? { color: palette.warning }
                  : caught
                  ? { color: palette.success }
                  : { color: ACCENT },
              ]}
            >
              {isTie
                ? "It's a tie!"
                : caught
                ? "Impostor caught!"
                : "Impostor got away!"}
            </Text>
            <Text style={styles.outcomeSubtitle}>
              {isTie
                ? "No one was eliminated"
                : `${sessionPlayers[eliminated!]?.name ?? "Unknown"} was eliminated`}
            </Text>
          </View>

          {/* Secret word */}
          <View style={styles.wordCard}>
            <Text style={styles.wordLabel}>The secret word was</Text>
            <Text style={styles.bigWord}>{game.secretWord}</Text>
          </View>

          {/* Impostor reveal */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {impostorNames.length === 1 ? "The Impostor" : "The Impostors"}
            </Text>
            {impostorNames.map((name) => (
              <View key={name} style={[styles.playerRow, { borderColor: ACCENT }]}>
                <ImpostorIcon size={24} />
                <Text style={[styles.playerName, { color: ACCENT }]}>{name}</Text>
              </View>
            ))}
          </View>

          {/* Vote tally (app mode only) */}
          {game.votingMode === "app" && voteTally.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Vote tally</Text>
              {voteTally.map(({ uid, name, count }) => {
                const isEliminated = uid === eliminated;
                const isImpostor = game.impostorUids.includes(uid);
                const rowColor = caught ? palette.success : palette.danger;
                return (
                  <View
                    key={uid}
                    style={[
                      styles.tallyRow,
                      isEliminated && {
                        borderColor: rowColor,
                        backgroundColor: rowColor + "18",
                      },
                    ]}
                  >
                    <Text style={styles.tallyCount}>{count}</Text>
                    <Text
                      style={[
                        styles.tallyName,
                        isEliminated && { color: palette.white },
                      ]}
                    >
                      {name}
                    </Text>
                    <View style={styles.tallyBadges}>
                      {isEliminated && (
                        <Text
                          style={[
                            styles.tallyBadge,
                            { borderColor: rowColor, color: rowColor },
                          ]}
                        >
                          eliminated
                        </Text>
                      )}
                      {isImpostor && (
                        <View style={[styles.tallyBadge, { borderColor: ACCENT }]}>
                          <ImpostorIcon size={16} />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Points earned */}
          {myPtsEarned > 0 && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>
                +{myPtsEarned} pts for you this round!
              </Text>
            </View>
          )}

          {isHost ? (
            <Button
              label="Back to Hub"
              onPress={handleHostBackToHub}
              accentColor={ACCENT}
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          ) : (
            <View style={styles.waitingPill}>
              <Text style={styles.waitingPillText}>
                Waiting for host to end the round…
              </Text>
            </View>
          )}
        </ScrollView>
        {backBtn}
        {playersBtn}
      </SafeAreaView>
    );
  }

  // ── Ended (legacy fallback) ────────────────────────────────

  if (game.status === "ended") {
    return (
      <SafeAreaView style={styles.safe}>
        {exitDialog}
        {kickModal}
        <View style={styles.center}>
          <Text style={styles.loading}>
            {game.winner === "crewmates"
              ? "Crewmates Win!"
              : game.winner === "impostors"
              ? "Impostors Win!"
              : "Game over"}
          </Text>
          {isHost && (
            <Button
              label="Back to Hub"
              onPress={handleHostBackToHub}
              accentColor={ACCENT}
              style={{ marginTop: spacing.xl }}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  // ── Kick UI ─────────────────────────────────────────────────
  kickBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: palette.bgCard,
    borderBottomWidth: 2,
    borderBottomColor: "#FF69B4",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  kickBannerText: { ...typography.body, color: palette.white, flex: 1 },
  kickBannerRemove: {
    backgroundColor: palette.danger,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  kickBannerKeep: {
    backgroundColor: palette.bgCardElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  kickBannerBtnText: { ...typography.caption, color: palette.white, fontWeight: "700" as const },
  playersBtn: {
    position: "absolute" as const,
    top: spacing.lg,
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  loading: { ...typography.heading2, color: palette.muted },
  phase: { ...typography.label, color: ACCENT, marginBottom: spacing.sm },
  title: { ...typography.heading1, color: palette.white, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: palette.muted, marginBottom: spacing.xl },

  // Discussion — role card
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
    marginBottom: spacing.sm,
  },

  // Voting — player list
  voteList: { gap: spacing.sm },
  voteRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  voteRowName: { ...typography.bodyBold, color: palette.white, flex: 1 },
  pickedCheck: { ...typography.heading3, color: ACCENT },

  // Voting — waiting state
  waitEmoji: { fontSize: 56, marginBottom: spacing.sm },
  waitTitle: { ...typography.heading2, color: palette.white },
  waitSubtitle: { ...typography.body, color: palette.muted, textAlign: "center" },

  // Reveal — outcome banner
  outcomeBanner: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  outcomeEmoji: { fontSize: 48 },
  outcomeTitle: { ...typography.heading1 },
  outcomeSubtitle: { ...typography.body, color: palette.muted, textAlign: "center" },

  // Reveal — word card
  wordCard: {
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

  // Reveal — sections
  section: { gap: spacing.sm, marginBottom: spacing.xl },

  // Reveal — vote tally
  tallyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  tallyCount: {
    ...typography.heading2,
    color: palette.muted,
    minWidth: 32,
    textAlign: "center",
  },
  tallyName: { ...typography.bodyBold, color: palette.muted, flex: 1 },
  tallyBadges: { flexDirection: "row", gap: spacing.xs },
  tallyBadge: {
    ...typography.caption,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // Reveal — points
  pointsBadge: {
    backgroundColor: palette.success + "22",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.success,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  pointsText: { ...typography.bodyBold, color: palette.success },

  // Reveal — non-host waiting
  waitingPill: {
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  waitingPillText: { ...typography.caption, color: palette.muted },
});
