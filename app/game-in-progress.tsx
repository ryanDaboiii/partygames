import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { palette, spacing, typography } from "../src/theme";
import { useSessionStore } from "../src/store/session";
import { subscribeToSession, type SessionData } from "../src/firebase/sessions";
import { WaitingDotsIcon } from "../src/assets/icons/WaitingDotsIcon";
import { BackButton } from "../src/components/BackButton";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function gameName(id: string | null): string {
  switch (id) {
    case "impostor": return "Impostor";
    case "wavelength": return "Wavelength";
    case "taboo": return "Taboo";
    default: return "A game";
  }
}

function gameAccent(id: string | null): string {
  switch (id) {
    case "impostor": return palette.impostor;
    case "wavelength": return palette.wavelength;
    case "taboo": return palette.taboo;
    default: return palette.wavelength;
  }
}

export default function GameInProgressScreen() {
  const router = useRouter();
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const mode = useSessionStore((s) => s.mode);

  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    if (!sessionCode || mode !== "online") return;
    return subscribeToSession(sessionCode, (data) => {
      if (data.ended) return;
      setSession(data);
      if (!data.currentGame || data.gameStatus !== "in-progress") {
        router.replace("/hub");
      }
    });
  }, [sessionCode, mode]);

  const currentGame = session?.currentGame ?? null;
  const accent = gameAccent(currentGame);

  const players = session
    ? Object.entries(session.players).map(([uid, p]) => ({
        uid,
        name: p.name,
        isHost: uid === session.hostId,
      }))
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: accent }]}>{gameName(currentGame)}</Text>
          <Text style={styles.heroSubtitle}>Being played on the host's phone</Text>
        </View>

        <View style={[styles.infoCard, { borderColor: accent + "44", backgroundColor: accent + "11" }]}>
          <Text style={styles.infoText}>
            Watch the host's screen and participate!{"\n"}You'll be brought back here when it ends.
          </Text>
        </View>

        {players.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Players in session ({players.length})</Text>
            <View style={styles.playerList}>
              {players.map(({ uid, name, isHost }) => (
                <View key={uid} style={styles.playerRow}>
                  <View style={[styles.avatar, { backgroundColor: accent + "33" }]}>
                    <Text style={[styles.avatarText, { color: accent }]}>{getInitials(name)}</Text>
                  </View>
                  <Text style={styles.playerName}>{name}</Text>
                  {isHost && (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>HOST</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.waitingRow}>
          <WaitingDotsIcon size={24} />
          <Text style={styles.waitingText}>Waiting for the host…</Text>
        </View>
      </ScrollView>
      <BackButton onPress={() => router.replace('/hub')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },

  hero: { alignItems: "center", paddingTop: spacing.xl, gap: spacing.sm },
  heroTitle: { fontSize: 32, fontWeight: "900", textAlign: "center" },
  heroSubtitle: { ...typography.body, color: palette.muted, textAlign: "center" },

  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
  },
  infoText: { ...typography.body, color: palette.white, textAlign: "center", lineHeight: 24 },

  section: { gap: spacing.md },
  sectionLabel: { ...typography.label, color: palette.muted },
  playerList: { gap: spacing.sm },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...typography.caption, fontSize: 12 },
  playerName: { ...typography.bodyBold, color: palette.white, flex: 1 },
  hostBadge: {
    backgroundColor: palette.warning + "33",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hostBadgeText: { fontSize: 9, fontWeight: "800", color: palette.warning, letterSpacing: 0.5 },

  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  waitingDot: { fontSize: 10 },
  waitingText: { ...typography.caption, color: palette.muted },
});
