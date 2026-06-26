import React, { useRef } from "react";
import { Pressable, Text, StyleSheet, Animated, ViewStyle, ActivityIndicator, View } from "react-native";
import { spacing, typography } from "../theme";

const EDGE = 4;

function darkenColor(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const dr = Math.max(0, Math.round(r * (1 - amount)));
  const dg = Math.max(0, Math.round(g * (1 - amount)));
  const db = Math.max(0, Math.round(b * (1 - amount)));
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
}

interface GameButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function GameButton({
  label,
  onPress,
  color = "#FF2D78",
  textColor = "#FFFFFF",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: GameButtonProps) {
  const edgeColor = darkenColor(color, 0.3);
  const offset = useRef(new Animated.Value(0)).current;

  const borderBottomWidth = offset.interpolate({
    inputRange: [0, EDGE],
    outputRange: [EDGE, 0],
    extrapolate: "clamp",
  });

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(offset, {
      toValue: EDGE,
      damping: 15,
      stiffness: 300,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(offset, {
      toValue: 0,
      damping: 15,
      stiffness: 300,
      useNativeDriver: false,
    }).start();
  };

  const sizeStyle =
    size === "sm" ? styles.sizeSm : size === "lg" ? styles.sizeLg : styles.sizeMd;

  const labelSizeStyle =
    size === "sm" ? styles.labelSm : size === "lg" ? styles.labelLg : null;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={!disabled ? onPress : undefined}
      disabled={disabled}
      style={[fullWidth && styles.fullWidth, disabled && styles.disabled, style]}
    >
      <Animated.View
        style={[
          styles.face,
          sizeStyle,
          {
            backgroundColor: color,
            borderBottomColor: edgeColor,
            transform: [{ translateY: offset }],
            borderBottomWidth,
          },
        ]}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={textColor} />
            <Text style={[styles.label, { color: textColor }, labelSizeStyle]}>Loading…</Text>
          </View>
        ) : (
          <Text style={[styles.label, { color: textColor }, labelSizeStyle]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: "100%" },
  disabled: { opacity: 0.4 },
  face: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: EDGE,
  },
  sizeSm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    borderRadius: 12,
  },
  sizeMd: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },
  sizeLg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    minHeight: 64,
    borderRadius: 20,
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: {
    ...typography.bodyBold,
    letterSpacing: 0.3,
  },
  labelSm: {
    fontSize: 14,
  },
  labelLg: {
    fontSize: 18,
  },
});
