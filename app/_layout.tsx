import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { useEffect, useRef } from "react";
import { palette } from "../src/theme";
import { useSessionStore } from "../src/store/session";
import { usePlayerStore } from "../src/store/players";
import { subscribeToSession } from "../src/firebase/sessions";

// Persistent watcher — always mounted, works regardless of which screen is active.
// Handles the case where the host ends the session while players are mid-game.
function SessionEndWatcher() {
  const router = useRouter();
  const mode = useSessionStore((s) => s.mode);
  const isHost = useSessionStore((s) => s.isHost);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const clearSession = useSessionStore((s) => s.clearSession);
  const resetAll = usePlayerStore((s) => s.resetAll);
  const handledRef = useRef(false);

  useEffect(() => {
    if (mode !== "online" || isHost || !sessionCode) return;
    handledRef.current = false;

    return subscribeToSession(sessionCode, (data) => {
      if (!data.ended || handledRef.current) return;
      handledRef.current = true;

      const leave = () => {
        resetAll();
        clearSession();
        router.replace("/");
      };

      if (Platform.OS === "web") {
        // On web, clear state first, then navigate. Avoids the race between
        // window.alert unblocking and React re-renders from clearSession().
        resetAll();
        clearSession();
        window.alert("The host has ended this session.");
        router.replace("/");
      } else {
        Alert.alert("Session Ended", "The host has ended this session.", [
          { text: "OK", onPress: leave },
        ]);
      }
    });
  }, [mode, isHost, sessionCode]);

  return null;
}

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SessionEndWatcher />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
          animation: "slide_from_right",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
});
