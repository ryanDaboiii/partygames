import { Stack } from "expo-router";
import { useEffect } from "react";
import { palette } from "../../../src/theme";
import { stopMusic } from "../../../src/hooks/useGameMusic";

export default function TabooLayout() {
  useEffect(() => {
    stopMusic();
  }, []);

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
