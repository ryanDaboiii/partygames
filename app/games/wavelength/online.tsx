import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { GameButton } from "../../../src/components/GameButton";
import { HoldToReveal } from "../../../src/components/HoldToReveal";
import { palette, spacing, typography, scaleFont, shadows } from "../../../src/theme";
import { useSessionStore } from "../../../src/store/session";
import { usePlayerStore } from "../../../src/store/players";
import { ensureAnonymousAuth } from "../../../src/firebase/rooms";
import { auth } from "../../../src/firebase/config";
import { clearSessionCurrentGame } from "../../../src/firebase/sessions";
import {
  subscribeToWavelengthState,
  startWavelengthCluePhase,
  advanceWavelengthClueTurn,
  advanceToWavelengthGuess,
  submitWavelengthGuess,
  switchWavelengthCategory,
  startWavelengthRound,
  markWavelengthRevealed,
  requestWavelengthExtraClue,
  clearWavelengthState,
  type WavelengthFSState,
  type WavelengthFSAssignment,
} from "../../../src/firebase/wavelength";
import { addPointsOnline } from "../../../src/firebase/sessions";
import { CATEGORIES, pickCategories } from "../../../src/games/wavelength/categories";
import { getGameTheme } from "../../../src/games/registry";
import { BackButton } from "../../../src/components/BackButton";
import { ExitGameDialog } from "../../../src/components/ExitGameDialog";
import { EyesClosedIcon } from "../../../src/assets/icons/EyesClosedIcon";
import { CategorySwitchIcon } from "../../../src/assets/icons/CategorySwitchIcon";
import { HourglassIcon } from "../../../src/assets/icons/HourglassIcon";
import { TargetIcon } from "../../../src/assets/icons/TargetIcon";
import { CheckIcon } from "../../../src/assets/icons/CheckIcon";
import { XIcon } from "../../../src/assets/icons/XIcon";
import ConfettiCannon from "react-native-confetti-cannon";

const GAME_THEME = getGameTheme("wavelength");
const ACCENT = GAME_THEME.accent;
const MAX_SWITCHES = 3;
const PICKER_ITEM_H = 64;
const PICKER_VISIBLE = 5;
const { width: screenWidth } = Dimensions.get("window");

export default function WavelengthOnlineScreen() {
  const router = useRouter();
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const isHost = useSessionStore((s) => s.isHost);

  const localPlayers = usePlayerStore((s) => s.players);
  const addPoints = usePlayerStore((s) => s.addPoints);
  const linkFirebaseUid = usePlayerStore((s) => s.linkFirebaseUid);

  const myPlayerName = useSessionStore((s) => s.myPlayerName);
  const scoringMode = useSessionStore((s) => s.scoringMode);

  const [state, setState] = useState<WavelengthFSState | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [myRevealed, setMyRevealed] = useState(false);
  const [guessValue, setGuessValue] = useState<number | null>(null);

  const scoredRoundRef = useRef(-1);

  useEffect(() => {
    ensureAnonymousAuth()
      .then((user) => setMyUid(user.uid))
      .catch(() => {
        if (auth.currentUser) {
          setMyUid(auth.currentUser.uid);
        } else {
          setTimeout(() => {
            ensureAnonymousAuth()
              .then((user) => setMyUid(user.uid))
              .catch((e) => console.error('[WAVELENGTH] Auth failed after retry:', e));
          }, 1000);
        }
      });
  }, []);

  useEffect(() => {
    if (!sessionCode) return;
    return subscribeToWavelengthState(sessionCode, setState);
  }, [sessionCode]);

  useEffect(() => {
    setMyRevealed(false);
  }, [state?.round]);

  useEffect(() => {
    if (state?.phase === "guess") {
      setGuessValue(Math.ceil((1 + state.range) / 2));
    }
  }, [state?.phase]);

  useEffect(() => {
    if (!state || state.phase !== "result" || !state.result || !myUid) return;
    if (scoredRoundRef.current === state.round) return;
    scoredRoundRef.current = state.round;

    const correct = state.result.correct;
    const isGuesser = state.guesserId === myUid;
    const pts = correct
      ? isGuesser
        ? scoringMode === "extended" ? 3 : 1
        : scoringMode === "extended" ? 1 : 0
      : 0;
    if (pts > 0) {
      let local = localPlayers.find((p) => p.firebaseUid === myUid);
      if (!local) {
        const myName = state.playerNames[myUid];
        local = localPlayers.find(
          (p) => p.name.toLowerCase() === (myName ?? "").toLowerCase()
        );
        if (local) linkFirebaseUid(local.id, myUid);
      }
      if (local) addPoints(local.id, pts);
      if (sessionCode) addPointsOnline(sessionCode, myUid, pts).catch(() => {});
    }
  }, [state?.phase, state?.round, myUid]);

  const [showExitDialog, setShowExitDialog] = useState(false);

  const handleExitGame = async () => {
    setShowExitDialog(false);
    if (isHost && sessionCode) {
      try {
        await Promise.all([
          clearWavelengthState(sessionCode),
          clearSessionCurrentGame(sessionCode),
        ]);
      } catch (_) {}
    }
    router.replace('/hub');
  };

  const exitDialog = (
    <ExitGameDialog
      visible={showExitDialog}
      onKeepScores={handleExitGame}
      onVoidPoints={handleExitGame}
      onCancel={() => setShowExitDialog(false)}
    />
  );
  const backBtn = <BackButton onPress={() => setShowExitDialog(true)} color={GAME_THEME.accent} />;

  if (!state || !myUid) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Connecting…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isGuesser =
    state.guesserId === myUid ||
    (!state.assignments[myUid] && state.playerOrder.includes(myUid ?? ""));
  const guesserName = state.playerNames[state.guesserId] ?? "Guesser";
  const myAssignment = state.assignments[myUid] as WavelengthFSAssignment | undefined;
  const mySwitches = state.categorySwitches[myUid] ?? 0;
  const switchesLeft = MAX_SWITCHES - mySwitches;

  const cycleNumber = state.playerOrder.length > 0
    ? Math.ceil(state.round / state.playerOrder.length)
    : state.round;

  const displayCat = (a: { categoryName: string; categoryLabel: string }) =>
    state.categoryStyle === "simple" ? a.categoryName : (a.categoryLabel || a.categoryName);

  const handleSwitchCategory = async () => {
    if (!myUid || !sessionCode || switchesLeft <= 0) return;
    const assignedLabels = new Set(
      Object.values(state.assignments).map((a) => a.categoryLabel || a.categoryName)
    );
    const available = CATEGORIES.filter((c) => !assignedLabels.has(c.label));
    if (available.length === 0) return;
    const newCat = available[Math.floor(Math.random() * available.length)];
    setBusy(true);
    try {
      await switchWavelengthCategory(
        sessionCode,
        myUid,
        { categoryName: newCat.name, categoryLabel: newCat.label, categoryHint: newCat.hint },
        mySwitches + 1,
      );
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not switch category");
    } finally {
      setBusy(false);
    }
  };

  const handleStartClues = async () => {
    if (!sessionCode) return;
    const nonGuessers = state.playerOrder.filter((uid) => uid !== state.guesserId);
    const turnOrder = [...nonGuessers].sort(() => Math.random() - 0.5);
    setBusy(true);
    try {
      await startWavelengthCluePhase(sessionCode, turnOrder);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not start clue phase");
    } finally {
      setBusy(false);
    }
  };

  const handleClueDone = async () => {
    if (!sessionCode) return;
    const nextIndex = state.currentTurnIndex + 1;
    const isLast = nextIndex >= state.turnOrder.length;
    setBusy(true);
    try {
      await advanceWavelengthClueTurn(sessionCode, nextIndex, isLast ? "guessing-prep" : "clue");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not advance turn");
    } finally {
      setBusy(false);
    }
  };

  const handleRequestExtraClue = async () => {
    if (!sessionCode) return;
    const eligiblePlayers = state.playerOrder.filter((uid) => uid !== state.guesserId);
    if (eligiblePlayers.length === 0) return;
    const selectedUid = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
    setBusy(true);
    try {
      await requestWavelengthExtraClue(sessionCode, selectedUid);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not request extra clue");
    } finally {
      setBusy(false);
    }
  };

  const handleReadyToGuess = async () => {
    if (!sessionCode) return;
    setBusy(true);
    try {
      await advanceToWavelengthGuess(sessionCode);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not advance");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitGuess = async () => {
    if (!sessionCode || !state) return;
    const val = guessValue ?? Math.ceil((1 + state.range) / 2);
    setBusy(true);
    try {
      await submitWavelengthGuess(sessionCode, val, state.secretNumber);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not submit guess");
    } finally {
      setBusy(false);
    }
  };

  const handleNextRound = async () => {
    if (!sessionCode) return;
    const nextRound = state.round + 1;
    const guesserIdx = (nextRound - 1) % state.playerOrder.length;
    const nextGuesserId = state.playerOrder[guesserIdx];
    const nonGuessers = state.playerOrder.filter((uid) => uid !== nextGuesserId);
    const secretNumber = Math.floor(Math.random() * state.range) + 1;
    const cats = pickCategories(nonGuessers.length);
    const assignments: Record<string, WavelengthFSAssignment> = {};
    nonGuessers.forEach((uid, i) => {
      assignments[uid] = { categoryName: cats[i].name, categoryLabel: cats[i].label, categoryHint: cats[i].hint };
    });
    setBusy(true);
    try {
      await startWavelengthRound(sessionCode, {
        ...state,
        phase: "reveal",
        round: nextRound,
        guesserId: nextGuesserId,
        secretNumber,
        assignments,
        categorySwitches: {},
        revealedBy: [],
        turnOrder: [],
        currentTurnIndex: 0,
        guess: null,
        result: null,
      });
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Could not start next round");
    } finally {
      setBusy(false);
    }
  };

  const handleGameOver = async () => {
    if (!sessionCode) return;
    try {
      await Promise.all([
        clearWavelengthState(sessionCode),
        clearSessionCurrentGame(sessionCode),
      ]);
    } catch (_) {}
    router.replace("/hub");
  };

  // ── Phase: REVEAL ─────────────────────────────────────────────────────────

  if (state.phase === "reveal") {
    if (isGuesser) {
      const revealedBy = state.revealedBy ?? [];
      const nonGuesserCount = state.playerOrder.length - 1;
      const allRevealed = revealedBy.length >= nonGuesserCount;

      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
          {exitDialog}
          <View style={styles.page}>
            <RoundBadge cycle={cycleNumber} totalRounds={state.totalRounds} />
            <View style={styles.center}>
              <EyesClosedIcon size={64} />
              <Text style={styles.bigTitle}>You're the Guesser!</Text>
              <Text style={styles.mutedBody}>
                Everyone else is memorising their number and category. Look away!
              </Text>
            </View>
            {allRevealed ? (
              <GameButton
                label={busy ? "Starting…" : "Start Clue Round →"}
                onPress={handleStartClues}
                color={ACCENT}
                textColor={GAME_THEME.text}
                fullWidth
                disabled={busy}
              />
            ) : (
              <View style={styles.waitingPill}>
                <Text style={styles.waitingText}>
                  Waiting for everyone to reveal… ({revealedBy.length} of {nonGuesserCount} ready)
                </Text>
              </View>
            )}
          </View>
          {backBtn}
        </SafeAreaView>
      );
    }

    if (!myAssignment && myUid !== state.guesserId) {
      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
          {exitDialog}
          <View style={styles.center}>
            <Text style={styles.loadingText}>Connecting…</Text>
          </View>
          {backBtn}
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        {exitDialog}
        <ScrollView contentContainerStyle={styles.scrollPage} showsVerticalScrollIndicator={false}>
          <RoundBadge cycle={cycleNumber} totalRounds={state.totalRounds} />

          <HoldToReveal
            accentColor={ACCENT}
            holdDuration={800}
            holdLabel="Hold to reveal your number and category"
            onReveal={() => {
              setMyRevealed(true);
              if (myUid && sessionCode) {
                markWavelengthRevealed(sessionCode, myUid).catch(() => {});
              }
            }}
          >
            <View style={styles.revealCard}>
              <Text style={styles.cardSubLabel}>The secret number is</Text>
              <Text style={[styles.secretNumber, { color: ACCENT }]}>{state.secretNumber}</Text>
              <Text style={styles.cardSubLabel}>out of {state.range}</Text>
              <View style={styles.divider} />
              <Text style={[styles.categoryChipLabel, { color: ACCENT }]}>YOUR CATEGORY</Text>
              <Text style={styles.categoryName}>{displayCat(myAssignment)}</Text>
              {state.categoryStyle === "specific" && (
                <Text style={styles.categoryHint}>{myAssignment.categoryHint}</Text>
              )}
            </View>
          </HoldToReveal>

          {myRevealed && (
            <>
              <View style={styles.switchRow}>
                {switchesLeft > 0 ? (
                  <Pressable
                    style={[styles.switchBtn, busy && { opacity: 0.5 }]}
                    onPress={handleSwitchCategory}
                    disabled={busy}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <CategorySwitchIcon size={20} />
                      <Text style={styles.switchBtnText}>New category ({switchesLeft} left)</Text>
                    </View>
                  </Pressable>
                ) : (
                  <Text style={styles.switchExhausted}>No more switches this round</Text>
                )}
              </View>

              <View style={styles.waitingPill}>
                <Text style={styles.waitingText}>Waiting for guesser to start clues…</Text>
              </View>
            </>
          )}
        </ScrollView>
        {backBtn}
      </SafeAreaView>
    );
  }

  // ── Phase: CLUE ──────────────────────────────────────────────────────────

  if (state.phase === "clue") {
    const activeUid = state.turnOrder[state.currentTurnIndex];
    const activeName = state.playerNames[activeUid] ?? "…";
    const isMyTurn = activeUid === myUid;
    const pastGivers = state.turnOrder
      .slice(0, state.currentTurnIndex)
      .map((uid) => state.playerNames[uid] ?? uid);

    if (isGuesser) {
      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
          {exitDialog}
          <View style={styles.page}>
            <RoundBadge cycle={cycleNumber} totalRounds={state.totalRounds} />
            <View style={styles.center}>
              <Text style={styles.bigEmoji}>👂</Text>
              <Text style={styles.bigTitle}>Listen carefully!</Text>
              <Text style={[styles.subTitle, { color: ACCENT }]}>{activeName} is giving their clue</Text>
            </View>
            <ClueSoFarList givers={pastGivers} />
            <View style={styles.waitingPill}>
              <Text style={styles.waitingText}>
                Clue {state.currentTurnIndex + 1} of {state.turnOrder.length}
              </Text>
            </View>
          </View>
          {backBtn}
        </SafeAreaView>
      );
    }

    if (isMyTurn) {
      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
          {exitDialog}
          <ScrollView contentContainerStyle={styles.scrollPage} showsVerticalScrollIndicator={false}>
            <RoundBadge cycle={cycleNumber} totalRounds={state.totalRounds} />
            <View style={styles.myTurnBanner}>
              <Text style={styles.myTurnLabel}>YOUR TURN</Text>
              <Text style={styles.bigTitle}>Give your clue!</Text>
            </View>

            <View style={styles.myTurnCard}>
              <Text style={styles.cardSubLabel}>Secret number</Text>
              <Text style={[styles.secretNumber, { color: ACCENT }]}>{state.secretNumber}</Text>
              <Text style={styles.cardSubLabel}>out of {state.range}</Text>
              <View style={styles.divider} />
              <Text style={styles.categoryChipLabel}>YOUR CATEGORY</Text>
              <Text style={styles.categoryName}>{myAssignment ? displayCat(myAssignment) : ""}</Text>
              {state.categoryStyle === "specific" && (
                <Text style={styles.categoryHint}>{myAssignment?.categoryHint}</Text>
              )}
            </View>

            <Text style={styles.instruction}>
              Say one word out loud that hints at where {state.secretNumber} falls on your scale.
              Then tap Done.
            </Text>

            <GameButton
              label={
                busy ? "Saving…" :
                state.currentTurnIndex < state.turnOrder.length - 1
                  ? "Done — Next player →"
                  : "Done — Guesser's turn →"
              }
              onPress={handleClueDone}
              color={ACCENT}
              textColor={GAME_THEME.text}
              fullWidth
              disabled={busy}
            />
          </ScrollView>
          {backBtn}
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        {exitDialog}
        <View style={styles.page}>
          <RoundBadge cycle={cycleNumber} totalRounds={state.totalRounds} />
          <View style={styles.center}>
            <HourglassIcon size={64} />
            <Text style={styles.bigTitle}>Waiting…</Text>
            <Text style={[styles.subTitle, { color: ACCENT }]}>{activeName} is giving their clue</Text>
          </View>
          <ClueSoFarList givers={pastGivers} />
          <View style={styles.waitingPill}>
            <Text style={styles.waitingText}>
              Clue {state.currentTurnIndex + 1} of {state.turnOrder.length}
            </Text>
          </View>
        </View>
        {backBtn}
      </SafeAreaView>
    );
  }

  // ── Phase: GUESSING-PREP ─────────────────────────────────────────────────

  if (state.phase === "guessing-prep") {
    if (isGuesser) {
      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
          {exitDialog}
          <View style={styles.page}>
            <RoundBadge cycle={cycleNumber} totalRounds={state.totalRounds} />
            <View style={styles.center}>
              <Text style={styles.bigTitle}>Time to think!</Text>
              <Text style={styles.mutedBody}>
                You heard everyone's clues.{"\n"}
                Think of a number between{" "}
                <Text style={{ color: ACCENT, fontWeight: "900" }}>1 and {state.range}</Text>.
              </Text>
            </View>
            <GameButton
              label={busy ? "Loading…" : "I'm ready to guess →"}
              onPress={handleReadyToGuess}
              color={ACCENT}
              textColor={GAME_THEME.text}
              fullWidth
              disabled={busy}
            />
            <Pressable
              style={[styles.extraClueBtn, busy && { opacity: 0.5 }]}
              onPress={handleRequestExtraClue}
              disabled={busy}
            >
              <Text style={styles.extraClueBtnText}>Need one more clue?</Text>
            </Pressable>
          </View>
          {backBtn}
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        {exitDialog}
        <View style={styles.page}>
          <RoundBadge cycle={cycleNumber} totalRounds={state.totalRounds} />
          <View style={styles.center}>
            <Text style={styles.bigTitle}>{guesserName} is thinking…</Text>
            <Text style={styles.mutedBody}>No more clues — shh!</Text>
          </View>
          <View style={styles.waitingPill}>
            <Text style={styles.waitingText}>Waiting for {guesserName} to be ready…</Text>
          </View>
        </View>
        {backBtn}
      </SafeAreaView>
    );
  }

  // ── Phase: GUESS ─────────────────────────────────────────────────────────

  if (state.phase === "guess") {
    if (isGuesser) {
      const mid = Math.ceil((1 + state.range) / 2);
      const pickerValue = guessValue ?? mid;

      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
          {exitDialog}
          <View style={styles.page}>
            <RoundBadge cycle={cycleNumber} totalRounds={state.totalRounds} />

            <View style={styles.guessHeader}>
              <Text style={styles.myTurnLabel}>YOUR GUESS</Text>
              <Text style={styles.mutedBody}>Scroll to pick a number — 1 to {state.range}</Text>
            </View>

            <NumberScrollPicker
              value={pickerValue}
              min={1}
              max={state.range}
              onChange={setGuessValue}
              accentColor={ACCENT}
            />

            <GameButton
              label={busy ? "Locking in…" : `Lock in ${pickerValue} →`}
              onPress={handleSubmitGuess}
              color={ACCENT}
              textColor={GAME_THEME.text}
              fullWidth
              disabled={busy}
            />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        <View style={styles.page}>
          <RoundBadge cycle={cycleNumber} totalRounds={state.totalRounds} />
          <View style={styles.center}>
            <TargetIcon size={64} />
            <Text style={styles.bigTitle}>{guesserName} is guessing…</Text>
            <Text style={styles.mutedBody}>They're entering their number now!</Text>
          </View>
          <View style={styles.waitingPill}>
            <Text style={styles.waitingText}>Waiting for {guesserName} to submit</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Phase: RESULT ────────────────────────────────────────────────────────

  if (state.phase === "result") {
    const correct = state.result?.correct ?? false;
    const isLastRound = state.round >= state.totalTurns;

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
        <ScrollView contentContainerStyle={styles.scrollPage} showsVerticalScrollIndicator={false}>
          <RoundBadge cycle={cycleNumber} totalRounds={state.totalRounds} />

          <View style={[
            styles.resultBanner,
            { borderColor: correct ? palette.success : palette.danger },
          ]}>
            {correct ? <TargetIcon size={48} /> : <XIcon size={48} />}
            <Text style={[styles.bigTitle, { color: correct ? palette.success : palette.danger }]}>
              {correct ? "Correct!" : "Wrong!"}
            </Text>
          </View>

          <View style={styles.guessCompareCard}>
            <View style={styles.guessCompareItem}>
              <Text style={styles.guessCompareLabel}>{guesserName} guessed</Text>
              <Text style={[
                styles.guessCompareNumber,
                { color: correct ? palette.success : palette.danger },
              ]}>
                {state.guess ?? "—"}
              </Text>
            </View>
            <View style={styles.guessCompareDivider} />
            <View style={styles.guessCompareItem}>
              <Text style={styles.guessCompareLabel}>Secret number</Text>
              <Text style={[styles.guessCompareNumber, { color: ACCENT }]}>
                {state.secretNumber}
              </Text>
            </View>
          </View>

          <View style={styles.assignmentsSection}>
            <Text style={styles.assignmentsSectionLabel}>Everyone's categories</Text>
            {state.playerOrder
              .filter((uid) => uid !== state.guesserId)
              .map((uid) => {
                const name = state.playerNames[uid] ?? uid;
                const cat = state.assignments[uid];
                return (
                  <View key={uid} style={styles.assignmentRow}>
                    <Text style={styles.assignmentName}>{name}</Text>
                    <Text style={styles.assignmentCat}>{cat ? displayCat(cat) : "—"}</Text>
                  </View>
                );
              })}
          </View>

          <View style={styles.scoresSummary}>
            <Text style={styles.assignmentsSectionLabel}>Points this round</Text>
            {correct ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <TargetIcon size={16} />
                  <Text style={styles.scoreItem}>{guesserName}: <Text style={{ color: palette.warning }}>+{scoringMode === "extended" ? 3 : 1} pts</Text></Text>
                </View>
                {scoringMode === "extended" && (
                  <Text style={styles.scoreItem}>All others: <Text style={{ color: ACCENT }}>+1 pt</Text></Text>
                )}
              </>
            ) : (
              <Text style={styles.scoreItem}>No points this round</Text>
            )}
          </View>

          {isHost ? (
            <GameButton
              label={busy ? "Loading…" : isLastRound ? "Back to Hub" : "Next Round →"}
              onPress={isLastRound ? handleGameOver : handleNextRound}
              color={ACCENT}
              textColor={GAME_THEME.text}
              fullWidth
              disabled={busy}
              style={styles.hostActionBtn}
            />
          ) : (
            <View style={styles.waitingPill}>
              <Text style={styles.waitingText}>
                {isLastRound
                  ? "Game over — waiting for host…"
                  : "Waiting for host to start next round…"}
              </Text>
            </View>
          )}
        </ScrollView>

        {correct && (
          <ConfettiCannon
            count={120}
            origin={{ x: screenWidth / 2, y: -20 }}
            autoStart={true}
            fadeOut={true}
            colors={["#4FC3F7", "#87D8FA", "#FFFFFF", "#A8DCEF"]}
          />
        )}
      </SafeAreaView>
    );
  }

  return null;
}

// ── Sub-components ────────────────────────────────────────────────────────

function RoundBadge({ cycle, totalRounds }: { cycle: number; totalRounds: number }) {
  return (
    <View style={rbStyles.badge}>
      <Text style={rbStyles.text}>Round {cycle} of {totalRounds}</Text>
    </View>
  );
}

function ClueSoFarList({ givers }: { givers: string[] }) {
  if (givers.length === 0) return null;
  return (
    <View style={csfStyles.box}>
      <Text style={csfStyles.label}>Clues given so far:</Text>
      {givers.map((name, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <CheckIcon size={14} />
          <Text style={csfStyles.item}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

function NumberScrollPicker({
  value,
  min,
  max,
  onChange,
  accentColor,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  accentColor: string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [displayed, setDisplayed] = useState(value);
  const didInitRef = useRef(false);
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / PICKER_ITEM_H);
    const n = numbers[Math.max(0, Math.min(numbers.length - 1, idx))];
    if (n !== displayed) setDisplayed(n);
  };

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / PICKER_ITEM_H);
    const n = numbers[Math.max(0, Math.min(numbers.length - 1, idx))];
    setDisplayed(n);
    onChange(n);
  };

  return (
    <View style={{ height: PICKER_ITEM_H * PICKER_VISIBLE, overflow: "hidden" }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: PICKER_ITEM_H * 2,
          left: spacing.xl,
          right: spacing.xl,
          height: PICKER_ITEM_H,
          borderTopWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: accentColor + "66",
        }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={PICKER_ITEM_H}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: PICKER_ITEM_H * 2 }}
        onLayout={() => {
          if (!didInitRef.current) {
            didInitRef.current = true;
            scrollRef.current?.scrollTo({ y: (value - min) * PICKER_ITEM_H, animated: false });
          }
        }}
      >
        {numbers.map((n) => {
          const isSel = n === displayed;
          return (
            <View key={n} style={{ height: PICKER_ITEM_H, alignItems: "center", justifyContent: "center" }}>
              <Text
                style={{
                  fontSize: isSel ? scaleFont(44) : scaleFont(26),
                  fontWeight: isSel ? ("900" as const) : ("400" as const),
                  color: isSel ? accentColor : palette.muted,
                  opacity: isSel ? 1 : 0.4,
                  letterSpacing: isSel ? -1 : 0,
                }}
              >
                {n}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  page: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    justifyContent: "space-between",
  },
  scrollPage: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.md },
  bigEmoji: { fontSize: scaleFont(64) },
  bigTitle: { ...typography.heading1, color: palette.white, textAlign: "center" },
  subTitle: { ...typography.heading3, textAlign: "center" },
  mutedBody: { ...typography.body, color: palette.muted, textAlign: "center", lineHeight: 22 },
  loadingText: { ...typography.heading3, color: palette.muted },

  waitingPill: {
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    alignItems: "center",
    ...shadows.sm,
  },
  waitingText: { ...typography.caption, color: palette.muted },

  categoryChipLabel: { ...typography.label, color: ACCENT },
  categoryName: { ...typography.heading2, color: palette.white },
  categoryHint: { ...typography.caption, color: palette.muted },
  switchRow: { alignItems: "flex-start" },
  switchBtn: {
    backgroundColor: GAME_THEME.accentMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  switchBtnText: { ...typography.caption, color: ACCENT, fontWeight: "700" },
  switchExhausted: { ...typography.caption, color: palette.muted },

  hostActionBtn: { marginTop: spacing.sm },

  extraClueBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center" as const,
    marginTop: spacing.sm,
  },
  extraClueBtnText: {
    ...typography.bodyBold,
    color: palette.muted,
  },

  revealCard: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    width: "100%",
  },

  secretNumber: {
    fontSize: scaleFont(72),
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: scaleFont(80),
  },
  cardSubLabel: { ...typography.label, color: palette.muted },

  myTurnBanner: { alignItems: "center", gap: spacing.xs },
  myTurnLabel: { ...typography.label, color: ACCENT },
  myTurnCard: {
    backgroundColor: GAME_THEME.accentMuted,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: ACCENT,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.md,
  },
  divider: { width: "80%", height: 1, backgroundColor: palette.border, marginVertical: spacing.xs },
  instruction: { ...typography.body, color: palette.muted, textAlign: "center" },

  guessHeader: { alignItems: "center", gap: spacing.xs },

  resultBanner: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.md,
  },

  guessCompareCard: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.sm,
  },
  guessCompareItem: { flex: 1, alignItems: "center", gap: spacing.xs },
  guessCompareLabel: { ...typography.label, color: palette.muted },
  guessCompareNumber: {
    fontSize: scaleFont(56),
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: scaleFont(62),
  },
  guessCompareDivider: {
    width: 1,
    height: 60,
    backgroundColor: palette.border,
    marginHorizontal: spacing.md,
  },

  assignmentsSection: { gap: spacing.sm },
  assignmentsSectionLabel: { ...typography.label, color: palette.muted },
  assignmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  assignmentName: { ...typography.bodyBold, color: palette.white },
  assignmentCat: {
    ...typography.caption,
    color: ACCENT,
    flexShrink: 1,
    textAlign: "right",
    maxWidth: "60%",
  },
  scoresSummary: { gap: spacing.sm },
  scoreItem: { ...typography.body, color: palette.white },
});

const rbStyles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: ACCENT + "22",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: { ...typography.label, color: ACCENT },
});

const csfStyles = StyleSheet.create({
  box: {
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  label: { ...typography.label, color: palette.muted, marginBottom: spacing.xs },
  item: { ...typography.caption, color: palette.success },
});
