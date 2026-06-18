import { Redirect } from "expo-router";

// Mode selection is no longer needed — session mode determines online vs offline.
// Route directly to setup where the branching happens.
export default function ImpostorHome() {
  return <Redirect href="/games/impostor/setup" />;
}
