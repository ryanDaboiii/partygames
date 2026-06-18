import React from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { palette, spacing, typography } from "../theme";
import type { GameDefinition } from "../games/registry";

interface GameCardProps {
  game: GameDefinition;
  onPress: () => void;
}

export function GameCard({ game, onPress }: GameCardProps) {
  const isComingSoon = game.status === "coming-soon";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isComingSoon && styles.cardDim,
        pressed && !isComingSoon && styles.pressed,
      ]}
      onPress={onPress}
      disabled={isComingSoon}
    >
      {/* Accent strip */}
      <View
        style={[
          styles.accentStrip,
          { backgroundColor: isComingSoon ? palette.border : game.accentColor },
        ]}
      />

      <View style={styles.content}>
        <Text style={styles.icon}>{game.icon}</Text>

        <View style={styles.textBlock}>
          <Text style={[styles.title, isComingSoon && styles.dimText]}>
            {game.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {game.description}
          </Text>
        </View>

        {isComingSoon && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SOON</Text>
          </View>
        )}

        {!isComingSoon && (
          <Text style={[styles.arrow, { color: game.accentColor }]}>›</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardDim: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  accentStrip: {
    width: 5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  icon: {
    fontSize: 36,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...typography.heading3,
    color: palette.white,
    marginBottom: 4,
  },
  dimText: {
    color: palette.muted,
  },
  description: {
    ...typography.caption,
    color: palette.muted,
  },
  badge: {
    backgroundColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    ...typography.label,
    color: palette.muted,
    fontSize: 9,
  },
  arrow: {
    fontSize: 28,
    fontWeight: "300",
    marginLeft: spacing.xs,
  },
});
