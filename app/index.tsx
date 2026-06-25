import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Button } from "../src/components/Button";
import { palette, spacing, typography } from "../src/theme";
import { usePlayerStore } from "../src/store/players";
import { useSessionStore } from "../src/store/session";
import {
  createOnlineSession,
  joinOnlineSession,
  startOnlineSession,
  setSessionScoringMode,
  subscribeToSession,
  type SessionData,
} from "../src/firebase/sessions";
import type { ScoringMode } from "../src/store/session";
import { PartyIcon } from "../src/assets/icons/PartyIcon";
import { GlobeIcon } from "../src/assets/icons/GlobeIcon";
import { LinkIcon } from "../src/assets/icons/LinkIcon";
import { PhoneIcon } from "../src/assets/icons/PhoneIcon";
import { TrophyIcon } from "../src/assets/icons/TrophyIcon";
import { ChartIcon } from "../src/assets/icons/ChartIcon";
import { ArrowRightIcon } from "../src/assets/icons/ArrowRightIcon";
import { ArrowLeftIcon } from "../src/assets/icons/ArrowLeftIcon";
import { XIcon } from "../src/assets/icons/XIcon";
import { useGameMusic } from "../src/hooks/useGameMusic";

type Step =
  | "choose"
  | "create-name"
  | "create-waiting"
  | "join"
  | "join-waiting"
  | "offline";

export default function LandingScreen() {
  useGameMusic("menu");
  const router = useRouter();
  const mode = useSessionStore((s) => s.mode);
  const setSession = useSessionStore((s) => s.setSession);
  const addPlayer = usePlayerStore((s) => s.addPlayer);
  const resetAll = usePlayerStore((s) => s.resetAll);

  const [step, setStep] = useState<Step>("choose");

  // ── CREATE flow ────────────────────────────────────────────
  const [createHostName, setCreateHostName] = useState("");
  const [createHostNameError, setCreateHostNameError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createSessionCode, setCreateSessionCode] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [scoringMode, setScoringModeLocal] = useState<ScoringMode>("conventional");

  // ── JOIN flow ──────────────────────────────────────────────
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinSessionCode, setJoinSessionCode] = useState<string | null>(null);

  // ── OFFLINE flow ───────────────────────────────────────────
  const [offlinePlayers, setOfflinePlayers] = useState<string[]>([]);
  const [offlineInput, setOfflineInput] = useState("");
  const [offlineError, setOfflineError] = useState<string | null>(null);

  // ── Shared live session data (both waiting screens) ────────
  const [liveSession, setLiveSession] = useState<SessionData | null>(null);
  const hasNavigatedRef = useRef(false);

  // ── Subscribe while on a waiting screen ───────────────────
  useEffect(() => {
    const code =
      step === "create-waiting"
        ? createSessionCode
        : step === "join-waiting"
        ? joinSessionCode
        : null;
    if (!code) return;
    setLiveSession(null);
    return subscribeToSession(code, setLiveSession);
  }, [step, createSessionCode, joinSessionCode]);

  // ── Auto-navigate non-host when host starts session ───────
  useEffect(() => {
    if (
      step !== "join-waiting" ||
      !liveSession?.started ||
      hasNavigatedRef.current ||
      !joinSessionCode
    )
      return;
    hasNavigatedRef.current = true;
    resetAll();
    Object.values(liveSession.players).forEach((p) => addPlayer(p.name));
    setSession({
      code: joinSessionCode,
      isHost: false,
      mode: "online",
      myPlayerName: joinName.trim(),
      scoringMode: liveSession.scoringMode ?? "conventional",
    });
    router.replace("/hub");
  }, [liveSession?.started, step]);

  // ── Redirect if session already active ────────────────────
  if (mode) {
    return <Redirect href="/hub" />;
  }

  // ── CREATE handlers ────────────────────────────────────────
  const handleCreateSession = async () => {
    const name = createHostName.trim();
    if (!name) {
      setCreateHostNameError("Enter your name.");
      return;
    }
    setCreating(true);
    try {
      const { sessionCode } = await createOnlineSession(name);
      setCreateSessionCode(sessionCode);
      setStep("create-waiting");
    } catch (e: any) {
      const msg: string = e?.message ?? "Could not create session";
      if (msg.includes("invalid-api-key") || msg.includes("YOUR_API_KEY")) {
        Alert.alert(
          "Firebase not configured",
          "Add your project keys to src/firebase/config.ts."
        );
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleStartSession = async () => {
    if (!createSessionCode || !liveSession) return;
    const playerList = Object.values(liveSession.players);
    if (playerList.length < 2) {
      Alert.alert("Not enough players", "Wait for at least 2 players to join.");
      return;
    }
    setStarting(true);
    try {
      resetAll();
      playerList.forEach((p) => addPlayer(p.name));
      setSession({
        code: createSessionCode,
        isHost: true,
        mode: "online",
        myPlayerName: createHostName.trim(),
        scoringMode,
      });
      await setSessionScoringMode(createSessionCode, scoringMode);
      await startOnlineSession(createSessionCode);
      router.replace("/hub");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not start session");
      setStarting(false);
    }
  };

  const resetCreate = () => {
    setCreateHostName("");
    setCreateHostNameError(null);
    setCreateSessionCode(null);
    setLiveSession(null);
  };

  // ── JOIN handlers ──────────────────────────────────────────
  const handleJoinSession = async () => {
    const code = joinCode.trim().toUpperCase();
    const name = joinName.trim();
    if (code.length < 4) {
      setJoinError("Enter a valid session code.");
      return;
    }
    if (!name) {
      setJoinError("Enter your name.");
      return;
    }
    setJoining(true);
    try {
      await joinOnlineSession(code, name);
      setJoinSessionCode(code);
      setStep("join-waiting");
    } catch (e: any) {
      setJoinError(e?.message ?? "Could not join session");
    } finally {
      setJoining(false);
    }
  };

  const resetJoin = () => {
    setJoinCode("");
    setJoinName("");
    setJoinError(null);
    setJoinSessionCode(null);
    setLiveSession(null);
    hasNavigatedRef.current = false;
  };

  // ── OFFLINE handlers ───────────────────────────────────────
  const handleOfflineAdd = () => {
    const t = offlineInput.trim();
    if (!t) {
      setOfflineError("Enter a name.");
      return;
    }
    if (offlinePlayers.some((n) => n.toLowerCase() === t.toLowerCase())) {
      setOfflineError("That name is already added.");
      return;
    }
    setOfflinePlayers((p) => [...p, t]);
    setOfflineInput("");
    setOfflineError(null);
  };

  const handleOfflineRemove = (name: string) => {
    setOfflinePlayers((p) => p.filter((n) => n !== name));
  };

  const handleOfflineStart = () => {
    if (offlinePlayers.length < 2) {
      Alert.alert("Not enough players", "Add at least 2 players to start.");
      return;
    }
    resetAll();
    offlinePlayers.forEach((n) => addPlayer(n));
    setSession({ code: null, isHost: true, mode: "offline", scoringMode });
    router.replace("/hub");
  };

  const resetOffline = () => {
    setOfflinePlayers([]);
    setOfflineInput("");
    setOfflineError(null);
  };

  // ── CHOOSE ─────────────────────────────────────────────────
  if (step === "choose") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.chooseContainer}>
          <View style={styles.hero}>
            <PartyIcon size={64} />
            <Text style={styles.appName}>Party Games</Text>
            <Text style={styles.tagline}>Pick your setup to get started</Text>
          </View>

          <View style={styles.optionList}>
            <Pressable
              style={styles.optionCard}
              onPress={() => {
                resetCreate();
                setStep("create-name");
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: palette.wavelength + "22" }]}>
                <GlobeIcon size={48} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Create Game</Text>
                <Text style={styles.optionDesc}>
                  Host a session — share a code for others to join from their phones
                </Text>
              </View>
              <ArrowRightIcon size={28} style={{ color: palette.wavelength }} />
            </Pressable>

            <Pressable
              style={styles.optionCard}
              onPress={() => {
                resetJoin();
                setStep("join");
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: palette.success + "22" }]}>
                <LinkIcon size={48} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Join Game</Text>
                <Text style={styles.optionDesc}>
                  Enter a session code to join a game in progress
                </Text>
              </View>
              <ArrowRightIcon size={28} style={{ color: palette.success }} />
            </Pressable>

            <Pressable
              style={styles.optionCard}
              onPress={() => {
                resetOffline();
                setStep("offline");
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: palette.impostor + "22" }]}>
                <PhoneIcon size={48} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Play on One Phone</Text>
                <Text style={styles.optionDesc}>
                  No internet needed — everyone passes the phone around
                </Text>
              </View>
              <ArrowRightIcon size={28} style={{ color: palette.impostor }} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── CREATE — enter host name ───────────────────────────────
  if (step === "create-name") {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.back} onPress={() => setStep("choose")}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ArrowLeftIcon size={18} />
                <Text style={styles.backText}>Back</Text>
              </View>
            </Pressable>

            <Text style={styles.formTitle}>Create Game</Text>
            <Text style={styles.formSubtitle}>
              What's your name? You'll be the host.
            </Text>

            <FormSection label="Your name">
              <TextInput
                style={styles.input}
                value={createHostName}
                onChangeText={(v) => {
                  setCreateHostName(v);
                  if (createHostNameError) setCreateHostNameError(null);
                }}
                placeholder="Your name"
                placeholderTextColor={palette.border}
                maxLength={20}
                autoFocus
                onSubmitEditing={handleCreateSession}
                returnKeyType="done"
              />
              {createHostNameError && (
                <Text style={styles.fieldError}>{createHostNameError}</Text>
              )}
            </FormSection>

            <Button
              label="Create Session"
              onPress={handleCreateSession}
              accentColor={palette.wavelength}
              loading={creating}
              disabled={!createHostName.trim()}
              fullWidth
              style={styles.submitBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── CREATE — waiting room ──────────────────────────────────
  if (step === "create-waiting") {
    const livePlayers = liveSession ? Object.values(liveSession.players) : [];
    const playerCount = livePlayers.length;

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formTitle}>Waiting for players</Text>
          <Text style={styles.formSubtitle}>
            Share this code — everyone joins from their own phone
          </Text>

          <View style={styles.codeBanner}>
            <Text style={styles.codeBannerLabel}>SESSION CODE</Text>
            <Text style={styles.codeBannerValue}>{createSessionCode}</Text>
          </View>

          <FormSection label={`Players joined (${playerCount})`}>
            {!liveSession ? (
              <ActivityIndicator color={palette.muted} />
            ) : playerCount === 0 ? (
              <Text style={styles.waitingText}>Waiting for players to join…</Text>
            ) : (
              <View style={styles.playerList}>
                {livePlayers.map((p, i) => (
                  <View key={i} style={styles.playerRow}>
                    <Text style={styles.playerName}>{p.name}</Text>
                    {i === 0 && <Text style={styles.badge}>host</Text>}
                  </View>
                ))}
              </View>
            )}
          </FormSection>

          <ScoringModePicker value={scoringMode} onChange={setScoringModeLocal} />

          {playerCount < 2 && (
            <Text style={styles.hint}>
              Need at least 2 players before you can start
            </Text>
          )}

          <Button
            label="Start Session"
            onPress={handleStartSession}
            accentColor={palette.wavelength}
            loading={starting}
            disabled={playerCount < 2}
            fullWidth
            style={styles.submitBtn}
          />

          <Button
            label="Cancel"
            onPress={() => {
              resetCreate();
              setStep("choose");
            }}
            variant="ghost"
            accentColor={palette.muted}
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── JOIN — enter code + name ───────────────────────────────
  if (step === "join") {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.back} onPress={() => setStep("choose")}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ArrowLeftIcon size={18} />
                <Text style={styles.backText}>Back</Text>
              </View>
            </Pressable>

            <Text style={styles.formTitle}>Join Game</Text>
            <Text style={styles.formSubtitle}>
              Enter the session code from the host's screen
            </Text>

            <FormSection label="Session code">
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={joinCode}
                onChangeText={(v) => {
                  setJoinCode(v.toUpperCase());
                  if (joinError) setJoinError(null);
                }}
                placeholder="e.g. AXBK2"
                placeholderTextColor={palette.border}
                maxLength={6}
                autoCapitalize="characters"
                autoFocus
              />
            </FormSection>

            <FormSection label="Your name">
              <TextInput
                style={styles.input}
                value={joinName}
                onChangeText={(v) => {
                  setJoinName(v);
                  if (joinError) setJoinError(null);
                }}
                placeholder="Your name"
                placeholderTextColor={palette.border}
                maxLength={20}
                onSubmitEditing={handleJoinSession}
                returnKeyType="done"
              />
            </FormSection>

            {joinError === "NAME_TAKEN" ? (
              <Text style={styles.nameTakenError}>
                That name is already taken in this session. Please choose a different name.
              </Text>
            ) : joinError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{joinError}</Text>
              </View>
            ) : null}

            <Button
              label="Join Session"
              onPress={handleJoinSession}
              accentColor={palette.success}
              loading={joining}
              disabled={joinCode.length < 4 || !joinName.trim()}
              fullWidth
              style={styles.submitBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── JOIN — waiting for host ────────────────────────────────
  if (step === "join-waiting") {
    const livePlayers = liveSession ? Object.values(liveSession.players) : [];

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formTitle}>You're in!</Text>
          <Text style={styles.formSubtitle}>
            Waiting for the host to start the session…
          </Text>

          <View style={styles.codeBanner}>
            <Text style={styles.codeBannerLabel}>SESSION CODE</Text>
            <Text style={styles.codeBannerValue}>{joinSessionCode}</Text>
          </View>

          <FormSection label={`Players (${livePlayers.length})`}>
            {!liveSession ? (
              <ActivityIndicator color={palette.muted} />
            ) : (
              <View style={styles.playerList}>
                {livePlayers.map((p, i) => {
                  const isYou = p.name.toLowerCase() === joinName.trim().toLowerCase();
                  return (
                    <View key={i} style={styles.playerRow}>
                      <Text
                        style={[
                          styles.playerName,
                          isYou && { color: palette.success },
                        ]}
                      >
                        {p.name}
                      </Text>
                      {i === 0 && !isYou && <Text style={styles.badge}>host</Text>}
                      {isYou && <Text style={[styles.badge, { color: palette.success, borderColor: palette.success }]}>you</Text>}
                    </View>
                  );
                })}
              </View>
            )}
          </FormSection>

          <Button
            label="Leave"
            onPress={() => {
              resetJoin();
              setStep("choose");
            }}
            variant="ghost"
            accentColor={palette.muted}
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── OFFLINE ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.back} onPress={() => setStep("choose")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <ArrowLeftIcon size={18} />
              <Text style={styles.backText}>Back</Text>
            </View>
          </Pressable>

          <Text style={styles.formTitle}>Play on One Phone</Text>
          <Text style={styles.formSubtitle}>
            Add everyone's names — no internet needed
          </Text>

          {offlinePlayers.length > 0 && (
            <FormSection label="Players">
              <View style={styles.playerList}>
                {offlinePlayers.map((name) => (
                  <View key={name} style={styles.playerRow}>
                    <Text style={styles.playerName}>{name}</Text>
                    <Pressable hitSlop={8} onPress={() => handleOfflineRemove(name)}>
                      <XIcon size={20} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </FormSection>
          )}

          <FormSection label="Add player">
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={offlineInput}
                onChangeText={(v) => {
                  setOfflineInput(v);
                  if (offlineError) setOfflineError(null);
                }}
                placeholder="Player name"
                placeholderTextColor={palette.border}
                maxLength={20}
                onSubmitEditing={handleOfflineAdd}
                returnKeyType="done"
                autoFocus
              />
              <Button
                label="Add"
                onPress={handleOfflineAdd}
                variant="secondary"
                accentColor={palette.impostor}
              />
            </View>
            {offlineError && <Text style={styles.fieldError}>{offlineError}</Text>}
          </FormSection>

          <ScoringModePicker value={scoringMode} onChange={setScoringModeLocal} />

          {offlinePlayers.length < 2 && (
            <Text style={styles.hint}>Add at least 2 players to start</Text>
          )}

          <Button
            label="Start"
            onPress={handleOfflineStart}
            accentColor={palette.impostor}
            disabled={offlinePlayers.length < 2}
            fullWidth
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ScoringModePicker({
  value,
  onChange,
}: {
  value: ScoringMode;
  onChange: (m: ScoringMode) => void;
}) {
  return (
    <View style={pickerStyles.wrap}>
      <Text style={pickerStyles.label}>Scoring Mode</Text>
      <View style={pickerStyles.row}>
        {(["conventional", "extended"] as ScoringMode[]).map((m) => {
          const selected = value === m;
          return (
            <Pressable
              key={m}
              style={[pickerStyles.option, selected && pickerStyles.optionSelected]}
              onPress={() => onChange(m)}
            >
              {m === "conventional" ? <TrophyIcon size={28} /> : <ChartIcon size={28} />}
              <Text style={[pickerStyles.optionTitle, selected && pickerStyles.optionTitleSelected]}>
                {m === "conventional" ? "Conventional" : "Extended"}
              </Text>
              <Text style={pickerStyles.optionDesc}>
                {m === "conventional"
                  ? "1 pt for a win, 0 for a loss"
                  : "Variable pts based on performance"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  label: { ...typography.label, color: palette.muted, marginBottom: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm },
  option: {
    flex: 1,
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  optionSelected: {
    borderColor: palette.wavelength,
    backgroundColor: palette.wavelength + "15",
  },
  optionEmoji: { fontSize: 22 },
  optionTitle: { ...typography.bodyBold, color: palette.muted, textAlign: "center" },
  optionTitleSelected: { color: palette.wavelength },
  optionDesc: { ...typography.caption, color: palette.muted, textAlign: "center", lineHeight: 16 },
});

function FormSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={formSectionStyles.wrap}>
      <Text style={formSectionStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const formSectionStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  label: { ...typography.label, color: palette.muted, marginBottom: spacing.md },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },

  // Choose screen
  chooseContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    justifyContent: "center",
  },
  hero: { alignItems: "center", marginBottom: spacing.xxl },
  logo: { fontSize: 64, marginBottom: spacing.md },
  appName: { ...typography.display, fontFamily: "HennyPenny_400Regular", color: palette.white, marginBottom: spacing.sm },
  tagline: { ...typography.body, color: palette.muted },

  optionList: { gap: spacing.md },
  optionCard: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionEmoji: { fontSize: 26 },
  optionText: { flex: 1 },
  optionTitle: { ...typography.heading3, color: palette.white, marginBottom: 4 },
  optionDesc: { ...typography.caption, color: palette.muted, lineHeight: 18 },
  optionArrow: { fontSize: 28, fontWeight: "300" },

  // Form screens
  formContainer: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  back: { marginBottom: spacing.xl },
  backText: { ...typography.bodyBold, color: palette.muted },
  formTitle: { ...typography.heading1, color: palette.white, marginBottom: spacing.sm },
  formSubtitle: { ...typography.body, color: palette.muted, marginBottom: spacing.xl },

  input: {
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.white,
    ...typography.body,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 6,
    textAlign: "center",
    paddingVertical: 18,
    lineHeight: 36,
  },

  // Code banner (waiting screens)
  codeBanner: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.wavelength,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  codeBannerLabel: {
    ...typography.label,
    color: palette.muted,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  codeBannerValue: {
    fontSize: 48,
    fontWeight: "900",
    color: palette.wavelength,
    letterSpacing: 8,
  },

  // Player list
  playerList: { gap: spacing.sm },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  playerName: { ...typography.bodyBold, color: palette.white },
  removeBtn: { ...typography.bodyBold, color: palette.muted, paddingHorizontal: spacing.sm },

  badge: {
    ...typography.caption,
    color: palette.muted,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  waitingText: { ...typography.body, color: palette.muted },
  addRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  hint: { ...typography.caption, color: palette.muted, marginBottom: spacing.lg },
  fieldError: { ...typography.caption, color: palette.danger, marginTop: spacing.sm },
  errorBox: {
    backgroundColor: palette.danger + "22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.danger,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBoxText: { ...typography.caption, color: palette.danger },
  nameTakenError: { color: "#FF2D78", fontSize: 13, marginTop: 6 },
  submitBtn: { marginTop: spacing.lg },
});
