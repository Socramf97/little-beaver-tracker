import { useContext } from "react";
import { ActiveBabyContext } from "../components/ActiveBabyProvider";

// Custom hook used to access the currently selected baby from anywhere
// in the app. This keeps feeding, diaper, history, and future screens
// connected to the same baby without passing IDs through every component.
export function useActiveBaby() {
  const context = useContext(ActiveBabyContext);

  // If this error appears, the screen is trying to use the active baby
  // before the provider has been added to the app. This helps catch
  // setup mistakes early during development.
  if (!context) {
    throw new Error(
      "useActiveBaby must be used within an ActiveBabyProvider"
    );
  }

  return context;
}