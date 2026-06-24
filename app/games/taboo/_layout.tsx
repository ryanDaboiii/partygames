import { Stack } from "expo-router";
import { palette } from "../../../src/theme";
import { useGameMusic } from "../../../src/hooks/useGameMusic";

export default function TabooLayout() {
  useGameMusic("taboo");
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
        animation: "slide_from_right",
      }}
    />
  );
}
