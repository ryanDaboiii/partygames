import { Platform } from "react-native";

function shadow(height: number, opacity: number, radius: number, elevation: number) {
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

export const shadows = {
  sm: shadow(2, 0.2, 4, 4),
  md: shadow(4, 0.3, 8, 8),
  lg: shadow(8, 0.4, 16, 16),
} as const;
