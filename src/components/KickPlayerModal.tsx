import React from "react";
import { View, Text, Modal, StyleSheet, Pressable, ScrollView } from "react-native";
import { palette, spacing, typography, shadows } from "../theme";

interface Player {
  uid: string;
  name: string;
}

interface Props {
  visible: boolean;
  players: Player[];
  myUid: string | null;
  onKick: (uid: string) => void;
  onClose: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function KickPlayerModal({ visible, players, myUid, onKick, onClose }: Props) {
  return (
    <Modal transparent visible={visible} animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Players</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {players.map((player) => (
              <View key={player.uid} style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(player.name)}</Text>
                </View>
                <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
                {player.uid !== myUid && (
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => onKick(player.uid)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: palette.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: "70%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
    marginBottom: spacing.lg,
  },
  title: { ...typography.heading2, color: palette.white, marginBottom: spacing.lg },
  list: { maxHeight: 320 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.bgCardElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...typography.caption, color: palette.muted, fontSize: 12 },
  name: { ...typography.bodyBold, color: palette.white, flex: 1 },
  removeBtn: {
    backgroundColor: palette.danger + "22",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  removeBtnText: { ...typography.caption, color: palette.danger, fontWeight: "700" },
  closeBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: palette.bgCardElevated,
    borderRadius: 12,
  },
  closeBtnText: { ...typography.bodyBold, color: palette.muted },
});
