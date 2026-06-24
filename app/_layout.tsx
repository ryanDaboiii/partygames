import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { MuteButton } from "../src/components/MuteButton";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import { HennyPenny_400Regular } from "@expo-google-fonts/henny-penny";
import { palette } from "../src/theme";
import { useSessionStore } from "../src/store/session";
import { usePlayerStore } from "../src/store/players";
import { subscribeToSession } from "../src/firebase/sessions";

// Persistent watcher — always mounted, works regardless of which screen is active.
// Handles two cases for non-host devices:
//   1. The host ends the entire session → show alert, navigate to home
//   2. A game ends (currentGame goes null) → navigate back to hub waiting screen
function SessionEndWatcher() {
  const router = useRouter();
  const mode = useSessionStore((s) => s.mode);
  const isHost = useSessionStore((s) => s.isHost);
  const sessionCode = useSessionStore((s) => s.sessionCode);
  const clearSession = useSessionStore((s) => s.clearSession);
  const resetAll = usePlayerStore((s) => s.resetAll);
  const handledRef = useRef(false);
  const inGameRef = useRef(false);

  useEffect(() => {
    if (mode !== "online" || isHost || !sessionCode) return;
    handledRef.current = false;
    inGameRef.current = false;

    return subscribeToSession(sessionCode, (data) => {
      // ── Case 1: host ended the whole session ────────────────────────────
      if (data.ended && !handledRef.current) {
        handledRef.current = true;
        const leave = () => { resetAll(); clearSession(); router.replace("/"); };
        if (Platform.OS === "web") {
          resetAll(); clearSession();
          window.alert("The host has ended this session.");
          router.replace("/");
        } else {
          Alert.alert("Session Ended", "The host has ended this session.", [
            { text: "OK", onPress: leave },
          ]);
        }
        return;
      }

      // ── Case 2: game started / ended ─────────────────────────────────────
      if (data.currentGame && data.gameStatus === "in-progress") {
        inGameRef.current = true;
      } else if (!data.currentGame && inGameRef.current) {
        // A game just ended — navigate non-host back to the hub waiting screen
        inGameRef.current = false;
        router.replace("/hub");
      }
    });
  }, [mode, isHost, sessionCode]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ HennyPenny_400Regular });

  if (!fontsLoaded) return null;

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
      <MuteButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
});
