import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { palette, spacing, typography } from "../../../src/theme";
import { useSessionStore } from "../../../src/store/session";
import { subscribeToSession, type SessionData } from "../../../src/firebase/sessions";

const ACCENT = palette.taboo;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function TabooSpectatorScreen() {
  const router = useRouter();
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const mode = useSessionStore((s) => s.mode);

  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    if (!sessionCode || mode !== "online") return;
    return subscribeToSession(sessionCode, (data) => {
      if (data.ended) return;
      setSession(data);
      // Navigate back to hub when game ends
      if (!data.currentGame || data.gameStatus !== "in-progress") {
        router.replace("/hub");
      }
    });
  }, [sessionCode, mode]);

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
          <Text style={styles.heroEmoji}>🚫</Text>
          <Text style={styles.heroTitle}>Taboo</Text>
          <Text style={styles.heroSubtitle}>Being played on the host's phone</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Watch the host's screen and listen! Shout "TABOO!" if they say a forbidden word.
          </Text>
        </View>

        {players.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Players ({players.length})</Text>
            <View style={styles.playerList}>
              {players.map(({ uid, name, isHost }) => (
                <View key={uid} style={styles.playerRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(name)}</Text>
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
          <Text style={styles.waitingDot}>●</Text>
          <Text style={styles.waitingText}>Waiting for round to finish…</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },

  hero: { alignItems: "center", paddingTop: spacing.xl, gap: spacing.sm },
  heroEmoji: { fontSize: 64 },
  heroTitle: { ...typography.display, color: palette.white },
  heroSubtitle: { ...typography.body, color: palette.muted, textAlign: "center" },

  infoCard: {
    backgroundColor: ACCENT + "15",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ACCENT + "44",
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
    backgroundColor: ACCENT + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...typography.caption, color: ACCENT, fontSize: 12 },
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
  waitingDot: { color: ACCENT, fontSize: 10 },
  waitingText: { ...typography.caption, color: palette.muted },
});
