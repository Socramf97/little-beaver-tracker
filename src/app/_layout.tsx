import { Stack } from "expo-router";
import { ActiveBabyProvider } from "../components/ActiveBabyProvider";

// Wrap the app with ActiveBabyProvider so every screen
// can access the currently selected baby.
export default function RootLayout() {
  return (
    <ActiveBabyProvider>
      <Stack />
    </ActiveBabyProvider>
  );
}