import React, { useRef, useState, useCallback } from "react";
import {
  Pressable,
  Text,
  View,
  Animated,
  StyleSheet,
  Vibration,
} from "react-native";
import { palette, spacing, typography } from "../theme";

interface HoldToRevealProps {
  /** Content shown when revealed */
  children: React.ReactNode;
  /** Label on the hold button */
  holdLabel?: string;
  /** Accent color for progress ring */
  accentColor?: string;
  /** How long to hold in ms before revealing (default 800) */
  holdDuration?: number;
  /** Called once when revealed */
  onReveal?: () => void;
  /** Called each time the card is hidden again */
  onHide?: () => void;
}

export function HoldToReveal({
  children,
  holdLabel = "Hold to reveal",
  accentColor = palette.impostor,
  holdDuration = 800,
  onReveal,
  onHide,
}: HoldToRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<ReturnType<typeof Animated.timing> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = useCallback(() => {
    anim.current = Animated.timing(progress, {
      toValue: 1,
      duration: holdDuration,
      useNativeDriver: false,
    });
    anim.current.start();

    holdTimer.current = setTimeout(() => {
      Vibration.vibrate(40);
      setRevealed(true);
      onReveal?.();
    }, holdDuration);
  }, [holdDuration, progress]);

  const cancelHold = useCallback(() => {
    anim.current?.stop();
    if (holdTimer.current) clearTimeout(holdTimer.current);
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleHide = () => {
    setRevealed(false);
    onHide?.();
  };

  if (revealed) {
    return (
      <View style={styles.revealedContainer}>
        {children}
        <Pressable style={[styles.hideButton, { borderColor: accentColor }]} onPress={handleHide}>
          <Text style={[styles.hideLabel, { color: accentColor }]}>Tap to hide</Text>
        </Pressable>
      </View>
    );
  }

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Pressable
      style={[styles.holdButton, { borderColor: accentColor }]}
      onPressIn={startHold}
      onPressOut={cancelHold}
    >
      {/* Progress fill */}
      <Animated.View
        style={[styles.progressFill, { width: progressWidth, backgroundColor: accentColor + "33" }]}
      />
      <Text style={styles.lockIcon}>🔒</Text>
      <Text style={styles.holdLabel}>{holdLabel}</Text>
      <Text style={[styles.holdSub, { color: accentColor }]}>
        Hold and don't let others see
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  holdButton: {
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    minHeight: 180,
    gap: spacing.sm,
  },
  progressFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
  },
  lockIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  holdLabel: {
    ...typography.heading3,
    color: palette.white,
  },
  holdSub: {
    ...typography.caption,
  },
  revealedContainer: {
    gap: spacing.lg,
    alignItems: "center",
  },
  hideButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  hideLabel: {
    ...typography.caption,
    fontWeight: "600",
  },
});
