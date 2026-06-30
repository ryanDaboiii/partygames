import React from "react";
import { Text, StyleSheet } from "react-native";

interface Props {
  size?: "large" | "small";
}

export default function AppLogo({ size = "small" }: Props) {
  return (
    <Text style={[styles.logo, size === "large" ? styles.large : styles.small]}>
      PartyFrenzy
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontFamily: "HennyPenny_400Regular",
    color: "#FFFFFF",
    textAlign: "center",
  },
  large: {
    fontSize: 42,
    marginBottom: 8,
  },
  small: {
    fontSize: 24,
    marginBottom: 12,
    opacity: 0.9,
  },
});
