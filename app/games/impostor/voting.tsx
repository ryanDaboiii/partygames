import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { HoldToReveal } from "../../../src/components/HoldToReveal";
import { Button } from "../../../src/components/Button";
import { palette, spacing, typography } from "../../../src/theme";
import { useImpostorStore } from "../../../src/games/impostor/gameStore";

const ACCENT = palette.impostor;

export default function VotingScreen() {
  const router = useRouter();
  const assignments = useImpostorStore((s) => s.assignments);
  const votes = useImpostorStore((s) => s.votes);
  const votingIndex = useImpostorStore((s) => s.votingIndex);
  const submitVote = useImpostorStore((s) => s.submitVote);
  const advanceVoting = useImpostorStore((s) => s.advanceVoting);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isLast = votingIndex === assignments.length - 1;
  const voter = assignments[votingIndex];

  if (!voter) return null;

  const otherPlayers = assignments.filter((a) => a.player.id !== voter.player.id);

  const handleSubmit = () => {
    if (!selectedId) return;
    submitVote({ voterId: voter.player.id, accusedId: selectedId });
    setSubmitted(true);
  };

  const handleNext = () => {
    setSelectedId(null);
    setSubmitted(false);
    if (isLast) {
      router.replace("/games/impostor/results");
    } else {
      advanceVoting();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Progress */}
        <View style={styles.dots}>
          {assignments.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < votingIndex && styles.dotDone,
                i === votingIndex && { backgroundColor: ACCENT },
              ]}
            />
          ))}
        </View>

        <Text style={styles.passPrompt}>
          Pass to <Text style={{ color: ACCENT }}>{voter.player.name}</Text>
        </Text>
        <Text style={styles.passHint}>Only you should be looking</Text>

        <View style={styles.cardArea}>
          <HoldToReveal
            accentColor={ACCENT}
            holdLabel="Hold to vote"
          >
            <View style={styles.voteCard}>
              <Text style={styles.voteTitle}>Who is the Impostor?</Text>
              <Text style={styles.voteHint}>Tap a player to select your vote</Text>

              <View style={styles.voteList}>
                {otherPlayers.map((a) => (
                  <Pressable
                    key={a.player.id}
                    style={[
                      styles.voteOption,
                      selectedId === a.player.id && {
                        borderColor: ACCENT,
                        backgroundColor: ACCENT + "22",
                      },
                    ]}
                    onPress={() => !submitted && setSelectedId(a.player.id)}
                    disabled={submitted}
                  >
                    <Text
                      style={[
                        styles.voteOptionText,
                        selectedId === a.player.id && { color: ACCENT },
                      ]}
                    >
                      {a.player.name}
                    </Text>
                    {selectedId === a.player.id && (
                      <Text style={{ color: ACCENT }}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>

              {!submitted ? (
                <Button
                  label="Confirm Vote"
                  onPress={handleSubmit}
                  accentColor={ACCENT}
                  fullWidth
                  disabled={!selectedId}
                />
              ) : (
                <View style={styles.votedBadge}>
                  <Text style={styles.votedText}>Vote locked in ✓</Text>
                </View>
              )}
            </View>
          </HoldToReveal>
        </View>

        {submitted && (
          <Button
            label={
              isLast
                ? "See Results"
                : `Done → Pass to ${assignments[votingIndex + 1]?.player.name ?? ""}`
            }
            onPress={handleNext}
            accentColor={ACCENT}
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, padding: spacing.lg, justifyContent: "space-between" },
  dots: { flexDirection: "row", gap: spacing.sm, justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.border },
  dotDone: { backgroundColor: palette.success },
  passPrompt: { ...typography.heading2, color: palette.white, textAlign: "center", marginTop: spacing.md },
  passHint: { ...typography.caption, color: palette.muted, textAlign: "center" },
  cardArea: { flex: 1, justifyContent: "center" },
  voteCard: { gap: spacing.md },
  voteTitle: { ...typography.heading2, color: palette.white, textAlign: "center" },
  voteHint: { ...typography.caption, color: palette.muted, textAlign: "center" },
  voteList: { gap: spacing.sm },
  voteOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.md,
  },
  voteOptionText: { ...typography.bodyBold, color: palette.white },
  votedBadge: {
    backgroundColor: palette.success + "22",
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  votedText: { ...typography.bodyBold, color: palette.success },
});
