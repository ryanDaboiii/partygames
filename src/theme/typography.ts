import { Platform } from "react-native";
import { scaleFont } from "./scale";

const fontFamily = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

export const typography = {
  display: {
    fontFamily,
    fontSize: scaleFont(48),
    fontWeight: "900" as const,
    letterSpacing: -1,
  },
  heading1: {
    fontFamily,
    fontSize: scaleFont(32),
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  heading2: {
    fontFamily,
    fontSize: scaleFont(24),
    fontWeight: "700" as const,
  },
  heading3: {
    fontFamily,
    fontSize: scaleFont(18),
    fontWeight: "700" as const,
  },
  body: {
    fontFamily,
    fontSize: scaleFont(16),
    fontWeight: "400" as const,
    lineHeight: scaleFont(24),
  },
  bodyBold: {
    fontFamily,
    fontSize: scaleFont(16),
    fontWeight: "600" as const,
  },
  caption: {
    fontFamily,
    fontSize: scaleFont(13),
    fontWeight: "500" as const,
    letterSpacing: 0.3,
  },
  label: {
    fontFamily,
    fontSize: scaleFont(11),
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
} as const;
