import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { useSessionStore } from "../../../src/store/session";
import { subscribeToSession, setReturnedToLobby } from "../../../src/firebase/sessions";
import { auth } from "../../../src/firebase/config";
import { TabooIcon } from "../../../src/assets/icons/TabooIcon";
import { BackButton } from "../../../src/components/BackButton";
import { LeaveGameDialog } from "../../../src/components/LeaveGameDialog";
import { getGameTheme } from "../../../src/games/registry";

const GAME_THEME = getGameTheme("taboo");

export default function TabooSpectatorScreen() {
  const router = useRouter();
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const mode = useSessionStore((s) => s.mode);

  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    if (!sessionCode || mode !== "online") return;
    return subscribeToSession(sessionCode, (data) => {
      if (data.ended) return;
      // Kick detection
      const uid = auth.currentUser?.uid;
      if (uid && !data.players[uid]) {
        router.replace("/");
        return;
      }
      // Navigate back to hub when game ends
      if (!data.currentGame || data.gameStatus !== "in-progress") {
        router.replace("/hub");
      }
    });
  }, [sessionCode, mode]);

  const handleLeave = async () => {
    setShowExitDialog(false);
    const uid = auth.currentUser?.uid;
    if (sessionCode && uid) {
      try { await setReturnedToLobby(sessionCode, uid); } catch {}
    }
    router.replace("/hub");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: GAME_THEME.accentDark }]}>
      <LeaveGameDialog
        visible={showExitDialog}
        onLeave={handleLeave}
        onCancel={() => setShowExitDialog(false)}
      />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <TabooIcon size={72} />
        <Text style={{ fontSize: 26, fontWeight: "bold", color: "#FFFFFF", textAlign: "center", marginTop: 24, marginBottom: 12 }}>
          Taboo is live!
        </Text>
        <Text style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 26 }}>
          The host is playing on their screen.{'\n'}No need to use your phone right now.
        </Text>
      </View>
      <BackButton onPress={() => setShowExitDialog(true)} color={GAME_THEME.accent} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
