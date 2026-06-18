import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../../src/components/Button";
import { palette, spacing, typography } from "../../../src/theme";
import { useWavelengthStore } from "../../../src/games/wavelength/store";
import { usePlayerStore } from "../../../src/store/players";
import { useSessionStore } from "../../../src/store/session";
import { setSessionCurrentGame } from "../../../src/firebase/sessions";
import { useGameIntro } from "../../../src/components/GameIntroOverlay";
import type { Player } from "../../../src/games/wavelength/types";

const ACCENT = palette.wavelength;
const MIN_PLAYERS = 3;
const MIN_MAX = 5;
const MAX_MAX = 20;
const MAX_ROUNDS = 30;

export default function WavelengthSetup() {
  const router = useRouter();
  const startGame = useWavelengthStore((s) => s.startGame);
  const reset = useWavelengthStore((s) => s.reset);
  const roster = usePlayerStore((s) => s.players);
  const mode = useSessionStore((s) => s.mode);
  const sessionCode = useSessionStore((s) => s.sessionCode);

  // Sitting-out exclusion — default everyone in
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const initialized = useRef(false);
  const [maxNumber, setMaxNumber] = useState(10);
  const [totalRounds, setTotalRounds] = useState(4);
  const [showExclusion, setShowExclusion] = useState(false);
  const { showThen, overlay } = useGameIntro();

  useEffect(() => {
    if (!initialized.current && roster.length > 0) {
      setSelectedIds(new Set(roster.map((p) => p.id)));
      setTotalRounds(roster.length);
      initialized.current = true;
    }
  }, [roster]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;
  const canStart = selectedCount >= MIN_PLAYERS;

  const handleStart = async () => {
    if (!canStart) return;
    reset();
    const players: Player[] = roster
      .filter((p) => selectedIds.has(p.id))
      .map((p) => ({ id: p.id, name: p.name }));
    startGame({ players, maxNumber, totalRounds });
    if (mode === "online" && sessionCode) {
      try { await setSessionCurrentGame(sessionCode, "wavelength"); } catch (_) {}
    }
    showThen(
      { icon: "📡", title: "Wavelength", accentColor: ACCENT },
      () => router.push("/games/wavelength/round")
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.icon}>📡</Text>
          <Text style={[styles.title, { color: ACCENT }]}>Wavelength</Text>
          <Text style={styles.tagline}>
            Everyone gets a number.{"\n"}Can the Guesser figure it out?
          </Text>
        </View>

        <Section label="Number range">
          <View style={styles.rangeRow}>
            <View style={styles.rangeLabel}>
              <Text style={styles.rangeLabelText}>1 – {maxNumber}</Text>
              <Text style={styles.rangeHint}>Guesser picks a number in this range</Text>
            </View>
            <Stepper
              value={maxNumber}
              min={MIN_MAX}
              max={MAX_MAX}
              onChange={setMaxNumber}
              compact
            />
          </View>
        </Section>

        <Section label="Number of rounds">
          <View style={styles.rangeRow}>
            <View style={styles.rangeLabel}>
              <Text style={styles.rangeLabelText}>{totalRounds} rounds</Text>
              <Text style={styles.rangeHint}>Everyone gets a turn as Guesser</Text>
            </View>
            <Stepper
              value={totalRounds}
              min={1}
              max={MAX_ROUNDS}
              onChange={setTotalRounds}
              compact
            />
          </View>
        </Section>

        {/* Sitting-out exclusion (collapsed by default) */}
        <Pressable
          style={styles.exclusionToggle}
          onPress={() => setShowExclusion((v) => !v)}
        >
          <Text style={styles.exclusionToggleText}>
            {showExclusion ? "▾" : "▸"} Sitting out? ({selectedCount} of {roster.length} playing)
          </Text>
        </Pressable>

        {showExclusion && roster.length > 0 && (
          <View style={styles.rosterList}>
            {roster.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <Pressable
                  key={p.id}
                  style={[styles.rosterRow, selected && { borderColor: ACCENT }]}
                  onPress={() => toggleSelected(p.id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selected && { backgroundColor: ACCENT, borderColor: ACCENT },
                    ]}
                  >
                    {selected && <Text style={styles.checkboxMark}>✓</Text>}
                  </View>
                  <Text style={styles.rosterName}>{p.name}</Text>
                </Pressable>
              );
            })}
            {!canStart && (
              <Text style={styles.warningText}>
                Select at least {MIN_PLAYERS} players to start.
              </Text>
            )}
          </View>
        )}

        <Button
          label="Start Game"
          onPress={handleStart}
          accentColor={ACCENT}
          fullWidth
          disabled={!canStart}
          style={styles.startBtn}
        />
      </ScrollView>
      {overlay}
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  compact = false,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  return (
    <View style={[stepperStyles.row, compact && stepperStyles.compact]}>
      <Pressable
        style={[stepperStyles.btn, value <= min && stepperStyles.btnDisabled]}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <Text style={stepperStyles.btnText}>−</Text>
      </Pressable>
      <Text style={compact ? stepperStyles.valueCompact : stepperStyles.value}>{value}</Text>
      <Pressable
        style={[stepperStyles.btn, value >= max && stepperStyles.btnDisabled]}
        onPress={() => onChange(Math.min(max, value + 1))}
      >
        <Text style={stepperStyles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  label: { ...typography.label, color: palette.muted, marginBottom: spacing.md },
});

const stepperStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  compact: { gap: spacing.md },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.35 },
  btnText: { ...typography.heading2, color: palette.white },
  value: { ...typography.heading1, color: palette.white, minWidth: 40, textAlign: "center" },
  valueCompact: {
    ...typography.heading3,
    color: palette.white,
    minWidth: 32,
    textAlign: "center",
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  back: { marginBottom: spacing.lg },
  backText: { ...typography.bodyBold, color: palette.muted },
  hero: { alignItems: "center", marginBottom: spacing.xxl },
  icon: { fontSize: 64, marginBottom: spacing.md },
  title: { ...typography.display, marginBottom: spacing.sm },
  tagline: {
    ...typography.body,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 26,
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  rangeLabel: { flex: 1, gap: 4 },
  rangeLabelText: { ...typography.heading3, color: palette.white },
  rangeHint: { ...typography.caption, color: palette.muted },
  exclusionToggle: { marginBottom: spacing.md },
  exclusionToggleText: { ...typography.caption, color: palette.muted },
  rosterList: { gap: spacing.sm, marginBottom: spacing.xl },
  rosterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxMark: { color: palette.white, fontSize: 14, fontWeight: "700" },
  rosterName: { ...typography.bodyBold, color: palette.white, flex: 1 },
  warningText: { ...typography.caption, color: palette.danger, marginTop: spacing.sm },
  startBtn: { marginTop: spacing.sm },
});
