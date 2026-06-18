import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { palette, spacing, typography } from "../theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  accentColor?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  accentColor = palette.impostor,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    variant === "primary" && { backgroundColor: accentColor },
    variant === "secondary" && styles.secondary,
    variant === "ghost" && styles.ghost,
    variant === "danger" && styles.danger,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.label,
    variant === "secondary" && { color: accentColor },
    variant === "ghost" && { color: palette.muted },
    variant === "danger" && { color: palette.danger },
    isDisabled && styles.labelDisabled,
  ];

  return (
    <Pressable
      style={({ pressed }) => [containerStyle, pressed && !isDisabled && styles.pressed]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? palette.white : accentColor} />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  secondary: {
    backgroundColor: palette.transparent,
    borderWidth: 2,
    borderColor: palette.border,
  },
  ghost: {
    backgroundColor: palette.transparent,
    paddingHorizontal: spacing.md,
  },
  danger: {
    backgroundColor: palette.transparent,
    borderWidth: 2,
    borderColor: palette.danger,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  label: {
    ...typography.bodyBold,
    color: palette.white,
    letterSpacing: 0.3,
  },
  labelDisabled: {
    color: palette.muted,
  },
});
