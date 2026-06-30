import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { palette, spacing, typography } from "../src/theme";
import { gameThemes } from "../src/theme/gameThemes";
import { ImpostorIcon } from "../src/assets/icons/ImpostorIcon";
import { WavelengthIcon } from "../src/assets/icons/WavelengthIcon";
import { TabooIcon } from "../src/assets/icons/TabooIcon";
import { ArrowLeftIcon } from "../src/assets/icons/ArrowLeftIcon";
import { SparkleIcon } from "../src/assets/icons/SparkleIcon";
import AppLogo from "../src/components/AppLogo";

type Section = {
  theme: { accent: string; accentDark: string; accentMuted: string };
  icon: React.ReactNode;
  title: string;
  tagline: string;
  rules: string[];
  tips: string[];
};

const SECTIONS: Section[] = [
  {
    theme: gameThemes.impostor,
    icon: <ImpostorIcon size={64} />,
    title: "Impostor",
    tagline: "One of you is lying. Figure out who.",
    rules: [
      "Everyone receives a secret role — most players are Crewmates, one (or more) is the Impostor.",
      "Crewmates all share the same secret word. The Impostor gets no word and must bluff.",
      "Players take turns giving a one-word or short clue related to the secret word.",
      "After everyone has given a clue, discuss who you think the Impostor is.",
      "Vote — the player with the most votes is eliminated.",
      "If you eliminate the Impostor, Crewmates win. If the wrong player is eliminated, the Impostor wins.",
    ],
    tips: [
      "As the Impostor, give vague clues that could mean anything.",
      "As a Crewmate, listen for clues that seem off or too general.",
    ],
  },
  {
    theme: gameThemes.wavelength,
    icon: <WavelengthIcon size={64} />,
    title: "Wavelength",
    tagline: "Everyone thinks differently. Find out by how much.",
    rules: [
      "A secret number is chosen within a range (e.g. 1–10).",
      'Everyone except the Guesser sees the number and receives a unique category (e.g. "Car brands based on their price").',
      "Each player picks something from their category that matches the number — if the number is 8, pick something near the top of the scale.",
      "Players take turns saying their word out loud, one at a time.",
      "After all clues are given, the Guesser tries to guess the secret number.",
      "The closer the guess, the more points earned.",
    ],
    tips: [
      'Think about what "average" feels like in your category — the number is relative.',
      'If you get "One More Clue", a random player gives an extra hint from a fresh category.',
    ],
  },
  {
    theme: gameThemes.taboo,
    icon: <TabooIcon size={64} />,
    title: "Taboo",
    tagline: "Describe it without saying the obvious.",
    rules: [
      "Players take turns being the Explainer.",
      "The Explainer sees a target word and a list of forbidden (taboo) words they cannot say.",
      "Give clues to get your teammates to guess the target word — without using the target word or any taboo words.",
      "For each correct guess, you earn a point. For each taboo word used, you lose a point.",
      "You have up to 10 passes per turn — use them to skip difficult cards (no point change).",
      "The timer runs — get through as many cards as possible before it runs out.",
      "After everyone has had a turn as Explainer, the player with the most points wins.",
    ],
    tips: [
      "Think around the word — describe what it does, where you find it, or how it feels.",
      "Watch the timer — don't spend too long on one card.",
    ],
  },
];

function GameSection({ section }: { section: Section }) {
  const { theme, icon, title, tagline, rules, tips } = section;
  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.accent, backgroundColor: theme.accentDark },
      ]}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={[styles.gameTitle, { color: theme.accent }]}>{title}</Text>
      <Text style={styles.tagline}>{tagline}</Text>

      <View style={styles.rulesContainer}>
        {rules.map((rule, i) => (
          <View key={i} style={styles.ruleRow}>
            <Text style={[styles.ruleNumber, { color: theme.accent }]}>{i + 1}</Text>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.tipsBlock, { backgroundColor: theme.accentMuted }]}>
        {tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <SparkleIcon size={14} style={{ marginTop: 3 }} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function InfoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <AppLogo size="small" />
          <Text style={styles.heading}>How to Play</Text>
          <Text style={styles.subheading}>Pick a game and learn the rules</Text>

          {SECTIONS.map((section) => (
            <GameSection key={section.title} section={section} />
          ))}
        </ScrollView>

        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <ArrowLeftIcon size={22} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingTop: 100, paddingBottom: spacing.xxxl },

  backButton: {
    position: "absolute",
    top: 52,
    left: 16,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  backText: {
    ...typography.bodyBold,
    color: palette.white,
  },

  heading: {
    ...typography.heading1,
    fontFamily: "HennyPenny_400Regular",
    color: palette.white,
    marginBottom: spacing.xs,
  },
  subheading: {
    ...typography.body,
    color: palette.muted,
    marginBottom: spacing.xxl,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  gameTitle: {
    ...typography.heading2,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: palette.muted,
    textAlign: "center",
    marginBottom: spacing.lg,
  },

  rulesContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  ruleNumber: {
    ...typography.bodyBold,
    width: 20,
    textAlign: "right",
    lineHeight: 24,
  },
  ruleText: {
    ...typography.body,
    color: palette.white,
    flex: 1,
  },

  tipsBlock: {
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  tipText: {
    ...typography.body,
    color: palette.white,
    flex: 1,
  },
});
