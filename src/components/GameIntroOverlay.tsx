import React, { useCallback, useRef, useState } from "react";
import { Animated, Modal, StyleSheet, Text, View } from "react-native";
import { palette, spacing, typography } from "../theme";

interface GameInfo {
  icon: string;
  title: string;
  accentColor: string;
}

export function useGameIntro() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);

  const showThen = useCallback(
    (info: GameInfo, callback: () => void) => {
      opacity.setValue(0);
      scale.setValue(0.88);
      setGameInfo(info);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]),
        Animated.delay(900),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        setGameInfo(null);
        callback();
      });
    },
    [opacity, scale]
  );

  const overlay = (
    <Modal visible={!!gameInfo} transparent animationType="none" onRequestClose={() => {}}>
      {/* Solid background — never animated so it's always opaque */}
      <View style={styles.bg}>
        {gameInfo && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: gameInfo.accentColor + "18" }]} />
        )}
        {/* Only the content fades/scales */}
        <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
          <Text style={styles.emoji}>{gameInfo?.icon}</Text>
          <Text style={[styles.title, gameInfo ? { color: gameInfo.accentColor } : undefined]}>
            {gameInfo?.title}
          </Text>
          <Text style={styles.subtitle}>Get ready…</Text>
        </Animated.View>
      </View>
    </Modal>
  );

  return { showThen, overlay };
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 96,
  },
  title: {
    ...typography.display,
    color: palette.white,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: palette.muted,
    letterSpacing: 1,
  },
});
