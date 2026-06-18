import { Stack } from "expo-router";
import { palette } from "../../../../src/theme";

export default function OnlineLayout() {
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
