import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../../src/components/Button";
import { palette, spacing, typography } from "../../../../src/theme";
import { CATEGORIES } from "../../../../src/games/impostor/words";
import {
  createRoom,
  subscribeToRoom,
  startOnlineGame,
  type RoomData,
} from "../../../../src/firebase/rooms";
import type { ImpostorCategory } from "../../../../src/games/impostor/types";

const ACCENT = palette.impostor;

export default function HostScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"config" | "lobby">("config");
  const [hostName, setHostName] = useState("Host");
  const [category, setCategory] = useState<ImpostorCategory>("Animals");
  const [impostorCount, setImpostorCount] = useState(1);
  const [roomCode, setRoomCode] = useState("");
  const [uid, setUid] = useState("");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    setCreating(true);
    try {
      const { roomCode: code, uid: myUid } = await createRoom(
        category,
        impostorCount,
        hostName.trim() || "Host"
      );
      setRoomCode(code);
      setUid(myUid);
      setStep("lobby");
    } catch (e: any) {
      const msg: string = e?.message ?? "Could not create room";
      // Surface Firebase config issues clearly
      if (msg.includes("invalid-api-key") || msg.includes("YOUR_API_KEY")) {
        setError("Firebase is not configured yet. Add your project keys to src/firebase/config.ts.");
      } else {
        setError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeToRoom(roomCode, setRoom);
    return unsub;
  }, [roomCode]);

  const handleStart = useCallback(async () => {
    if (!room || room.players.length < 3) {
      setError("Need at least 3 players to start.");
      return;
    }
    setError(null);
    setStarting(true);
    try {
      await startOnlineGame(roomCode);
      router.replace({
        pathname: "/games/impostor/online/play",
        params: { roomCode, uid },
      });
    } catch (e: any) {
      setError(e?.message ?? "Could not start game");
    } finally {
      setStarting(false);
    }
  }, [room, roomCode, uid, router]);

  if (step === "config") {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>

          <Text style={styles.title}>Host a Game</Text>

          <Section label="Your name">
            <TextInput
              style={styles.input}
              value={hostName}
              onChangeText={setHostName}
              placeholder="Host"
              placeholderTextColor={palette.border}
              maxLength={20}
            />
          </Section>

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
                    <Text style={[styles.chipText, category === cat && { color: palette.white }]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Section>

          <Section label="Impostors">
            <View style={styles.stepper}>
              <Pressable
                style={[styles.stepBtn, impostorCount <= 1 && styles.stepBtnDisabled]}
                onPress={() => setImpostorCount((c) => Math.max(1, c - 1))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{impostorCount}</Text>
              <Pressable
                style={[styles.stepBtn, impostorCount >= 3 && styles.stepBtnDisabled]}
                onPress={() => setImpostorCount((c) => Math.min(3, c + 1))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
          </Section>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            label="Create Room"
            onPress={handleCreate}
            accentColor={ACCENT}
            loading={creating}
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Lobby
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Lobby</Text>

        <View style={styles.codeBanner}>
          <Text style={styles.codeLabel}>Room code</Text>
          <Text style={styles.code}>{roomCode}</Text>
          <Text style={styles.codeHint}>Share this with your friends</Text>
        </View>

        <Section label={`Players (${room?.players.length ?? 0})`}>
          {room?.players.map((p) => (
            <View key={p.uid} style={styles.playerRow}>
              <Text style={styles.playerName}>{p.name}</Text>
              {p.uid === uid && (
                <Text style={[styles.badge, { color: ACCENT }]}>You (Host)</Text>
              )}
            </View>
          ))}
          {(room?.players.length ?? 0) < 3 && (
            <Text style={styles.waitHint}>Waiting for at least 3 players…</Text>
          )}
        </Section>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          label="Start Game"
          onPress={handleStart}
          accentColor={ACCENT}
          loading={starting}
          disabled={(room?.players.length ?? 0) < 3}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  label: { ...typography.label, color: palette.muted, marginBottom: spacing.md },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  back: { marginBottom: spacing.lg },
  backText: { ...typography.bodyBold, color: palette.muted },
  title: { ...typography.heading1, color: palette.white, marginBottom: spacing.xl },
  input: {
    backgroundColor: palette.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    color: palette.white,
    ...typography.body,
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
  stepValue: { ...typography.heading1, color: palette.white, minWidth: 40, textAlign: "center" },
  errorBox: {
    backgroundColor: palette.danger + "22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.danger,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: palette.danger },
  codeBanner: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: ACCENT,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  codeLabel: { ...typography.label, color: palette.muted },
  code: { fontSize: 48, fontWeight: "900", color: ACCENT, letterSpacing: 8 },
  codeHint: { ...typography.caption, color: palette.muted },
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
  badge: { ...typography.caption, fontWeight: "700" },
  waitHint: { ...typography.caption, color: palette.muted, marginTop: spacing.sm },
});
