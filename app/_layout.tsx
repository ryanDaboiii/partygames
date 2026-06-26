import React from "react";
import { Stack, useRouter, usePathname } from "expo-router";
import { useGameMusic } from "../src/hooks/useGameMusic";
import { StatusBar } from "expo-status-bar";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { MuteButton } from "../src/components/MuteButton";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import { HennyPenny_400Regular } from "@expo-google-fonts/henny-penny";
import { Quicksand_700Bold } from "@expo-google-fonts/quicksand";
import { palette } from "../src/theme";
import { fonts } from "../src/theme/fonts";
import { useSessionStore } from "../src/store/session";
import { usePlayerStore } from "../src/store/players";
import { subscribeToSession } from "../src/firebase/sessions";
import type { GameMusicId } from "../src/hooks/useGameMusic";

function getMusicForPath(path: string): GameMusicId | null {
  if (path === "/" || path.startsWith("/hub")) return "menu";
  if (path.startsWith("/games/impostor")) return "impostor";
  if (path.startsWith("/games/wavelength")) return "wavelength";
  if (path.startsWith("/games/taboo")) return "taboo";
  return null;
}

// Apply Quicksand as the default font for all Text components app-wide.
// HennyPenny (used on the title) still wins because its style appears later in the array.
const _Text = Text as any;
const _origRender = _Text.render;
if (typeof _origRender === "function") {
  _Text.render = function (...args: any[]) {
    const origin = _origRender.apply(this, args);
    return React.cloneElement(origin, {
      style: [{ fontFamily: fonts.ui }, origin.props.style],
    });
  };
}

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
  const isFirstCallbackRef = useRef(true);
  const lastNavigatedGameRef = useRef<string | null>(null);

  const navigateToGame = (gameId: string) => {
    switch (gameId) {
      case "impostor": router.replace("/games/impostor/online/play" as any); break;
      case "wavelength": router.replace("/games/wavelength/online" as any); break;
      case "taboo": router.replace("/games/taboo/spectator" as any); break;
      default: break;
    }
  };

  useEffect(() => {
    if (mode !== "online" || isHost || !sessionCode) return;
    handledRef.current = false;
    inGameRef.current = false;
    isFirstCallbackRef.current = true;
    lastNavigatedGameRef.current = null;

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

      const game = data.currentGame;
      const isActive = game && data.gameStatus === "in-progress";

      // ── Case 2: game started ─────────────────────────────────────────────
      if (isActive && game) {
        inGameRef.current = true;
        // Skip navigation on first callback — game was already running when we joined.
        if (isFirstCallbackRef.current) {
          isFirstCallbackRef.current = false;
          lastNavigatedGameRef.current = game;
          return;
        }
        // Navigate to game only when a genuinely new game starts.
        if (game !== lastNavigatedGameRef.current) {
          lastNavigatedGameRef.current = game;
          navigateToGame(game);
        }
      } else {
        if (isFirstCallbackRef.current) isFirstCallbackRef.current = false;
      }

      // ── Case 3: game ended ───────────────────────────────────────────────
      if (!game && inGameRef.current) {
        inGameRef.current = false;
        lastNavigatedGameRef.current = null;
        router.replace("/hub");
      }
    });
  }, [mode, isHost, sessionCode]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ HennyPenny_400Regular, Quicksand_700Bold });
  const pathname = usePathname();
  useGameMusic(getMusicForPath(pathname));

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
