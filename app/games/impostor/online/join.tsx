import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../../src/components/Button";
import { palette, spacing, typography } from "../../../../src/theme";
import { joinRoom } from "../../../../src/firebase/rooms";
import { ArrowLeftIcon } from "../../../../src/assets/icons/ArrowLeftIcon";

const ACCENT = palette.impostor;

export default function JoinScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    const trimCode = code.trim().toUpperCase();
    setError(null);
    if (trimCode.length < 4) {
      setError("Please enter the 5-character room code.");
      return;
    }
    setJoining(true);
    try {
      const { uid } = await joinRoom(trimCode, name.trim() || "Player");
      router.replace({
        pathname: "/games/impostor/online/play",
        params: { roomCode: trimCode, uid },
      });
    } catch (e: any) {
      setError(e?.message ?? "Could not join room");
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <ArrowLeftIcon size={18} />
            <Text style={styles.backText}>Back</Text>
          </View>
        </Pressable>

        <Text style={styles.title}>Join a Room</Text>
        <Text style={styles.subtitle}>
          Enter the 5-letter code shown on the host's screen
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Player"
            placeholderTextColor={palette.border}
            maxLength={20}
            autoFocus
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Room code</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            placeholder="XXXXX"
            placeholderTextColor={palette.border}
            maxLength={5}
            autoCapitalize="characters"
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          label="Join Game"
          onPress={handleJoin}
          accentColor={ACCENT}
          loading={joining}
          fullWidth
          style={styles.joinBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, padding: spacing.lg },
  back: { marginBottom: spacing.lg },
  backText: { ...typography.bodyBold, color: palette.muted },
  title: { ...typography.heading1, color: palette.white, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: palette.muted, marginBottom: spacing.xxl },
  form: { gap: spacing.sm },
  label: { ...typography.label, color: palette.muted },
  input: {
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.md,
    color: palette.white,
    ...typography.body,
    marginTop: spacing.sm,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 8,
    textAlign: "center",
    color: ACCENT,
  },
  errorBox: {
    backgroundColor: palette.danger + "22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.danger,
    padding: spacing.md,
  },
  errorText: { ...typography.caption, color: palette.danger },
  joinBtn: { marginTop: spacing.xl },
});
