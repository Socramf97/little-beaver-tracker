import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import { ActiveBabyProvider } from "../components/ActiveBabyProvider";

// Wrap the app with ActiveBabyProvider so every screen
// can access the currently selected baby.
export default function RootLayout() {
  return (
    <>
      <ActiveBabyProvider>
        <Stack />
        <Toast />
      </ActiveBabyProvider>
    </>
  );
}
