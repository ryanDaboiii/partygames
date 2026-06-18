import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { palette, spacing, typography } from "../theme";

interface TimerProps {
  initialSeconds: number;
  accentColor?: string;
  onExpire?: () => void;
}

export function Timer({ initialSeconds, accentColor = palette.impostor, onExpire }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  const stop = useCallback(() => {
    if (interval.current) clearInterval(interval.current);
    setRunning(false);
  }, []);

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          stop();
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running, stop, onExpire]);

  const toggle = () => setRunning((r) => !r);

  const reset = () => {
    stop();
    setSeconds(initialSeconds);
    expiredRef.current = false;
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${secs.toString().padStart(2, "0")}`;
  const isLow = seconds <= 10 && seconds > 0;
  const isExpired = seconds === 0;

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.display,
          { color: isExpired ? palette.danger : isLow ? palette.warning : accentColor },
        ]}
      >
        {display}
      </Text>
      <View style={styles.controls}>
        <Pressable style={[styles.btn, { borderColor: accentColor }]} onPress={toggle}>
          <Text style={[styles.btnText, { color: accentColor }]}>
            {running ? "Pause" : isExpired ? "Done" : "Start"}
          </Text>
        </Pressable>
        <Pressable style={styles.btnGhost} onPress={reset}>
          <Text style={styles.btnGhostText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
  },
  display: {
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: -2,
  },
  controls: {
    flexDirection: "row",
    gap: spacing.md,
  },
  btn: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  btnText: {
    ...typography.bodyBold,
  },
  btnGhost: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  btnGhostText: {
    ...typography.bodyBold,
    color: palette.muted,
  },
});
