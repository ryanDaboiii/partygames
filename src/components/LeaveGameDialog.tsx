import React from "react";
import { View, Text, Modal, StyleSheet, Pressable } from "react-native";
import { palette, spacing, typography } from "../theme";

interface Props {
  visible: boolean;
  onLeave: () => void;
  onCancel: () => void;
}

export function LeaveGameDialog({ visible, onLeave, onCancel }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Leave game?</Text>
          <Text style={styles.subtitle}>The host will be notified.</Text>
          <Pressable style={[styles.btn, styles.btnLeave]} onPress={onLeave}>
            <Text style={styles.btnTextLight}>Leave game</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnCancel]} onPress={onCancel}>
            <Text style={styles.btnTextMuted}>Cancel — stay in game</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    width: "100%",
    gap: spacing.md,
  },
  title: { ...typography.heading2, color: palette.white, textAlign: "center" },
  subtitle: { ...typography.body, color: palette.muted, textAlign: "center" },
  btn: {
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  btnLeave: { backgroundColor: palette.danger },
  btnCancel: {
    backgroundColor: palette.bgCardElevated,
    borderWidth: 1,
    borderColor: palette.border,
  },
  btnTextLight: { ...typography.bodyBold, color: palette.white },
  btnTextMuted: { ...typography.bodyBold, color: palette.muted },
});
