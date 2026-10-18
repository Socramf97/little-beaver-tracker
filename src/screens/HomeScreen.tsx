// HomeScreen.tsx
// Basic home dashboard screen for the Little Beaver Tracker app.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* App title displayed at the top of the home screen */}
      <Text style={styles.title}>Little Beaver Tracker</Text>

      {/* Temporary placeholder text to mark this as the initial UI/UX work */}
      <Text style={styles.subtitle}>Home Dashboard (UI/UX – Natasha)</Text>

      {/* Space reserved for future features like quick actions or baby summaries */}
      <Text style={styles.note}>
        More features will be added here as the project develops.
      </Text>

      {/* THIS IS TEMPORARY WILL DELETE LATER */}
      <Link href="/voice-test" style={{ fontSize: 18, padding: 12 }}>
        Voice test (dev button - temporary will delete )
      </Link>
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
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  note: {
    fontSize: 14,
    color: "#555",
  },
});
