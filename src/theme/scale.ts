import { Dimensions, Platform } from "react-native";

const BASE_WIDTH = 390;
const { width } = Dimensions.get("window");

export function scaleFont(size: number): number {
  if (Platform.OS === "web") return size;
  // Only scale down for smaller screens, never up
  const ratio = Math.min(1, width / BASE_WIDTH);
  return Math.round(ratio * size);
}
