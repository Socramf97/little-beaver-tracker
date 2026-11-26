// HomeScreen.tsx
// Basic home dashboard screen for the Little Beaver Tracker app.

import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useActiveBaby } from "../hooks/useActiveBaby";
import WakeWordScreen from "./WakeWordScreen";

export default function HomeScreen() {
  // Shows which baby is currently active throughout the app.
  const { activeBaby } = useActiveBaby();
  return (
    <View style={styles.container}>
      {/* App title displayed at the top of the home screen */}

      <Text style={styles.title}>Little Beaver Tracker</Text>

      <Text style={styles.note}>
        {activeBaby ? `Current Baby: ${activeBaby.name}` : "No Baby Selected"}
      </Text>

      <Text style={styles.note}>
        <Text style={styles.subtitle}>
          Track feedings, diaper changes, and baby care history.
        </Text>
      </Text>

      <Link href="/voice-test" style={styles.linkButton}>
        Voice Assistant
      </Link>

      <Link href="/baby-profiles" style={styles.linkButton}>
        Baby Profiles
      </Link>

      <Link href="/manual-feeding" style={styles.linkButton}>
        Manual Feeding Entry
      </Link>

      <Link href="/manual-diaper" style={styles.linkButton}>
        Manual Diaper Entry
      </Link>

      <Link href="/history" style={styles.linkButton}>
        View History
      </Link>

      <WakeWordScreen />
    </View>
  );
}

// Basic styling for layout and readability.
// Keeping things simple until more UI elements are added.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F6F1",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6B4423",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: "#4F4F4F",
    marginBottom: 20,
  },
  note: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },

  linkButton: {
    fontSize: 18,
    padding: 12,
    backgroundColor: "#A3C586",
    borderRadius: 10,
    marginVertical: 5,
    width: 250,
    textAlign: "center",
    color: "#000",
  },
});
