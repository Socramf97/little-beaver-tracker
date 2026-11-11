import { StyleSheet, Text, View } from "react-native";

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Event History
      </Text>

      <Text style={styles.filter}>
        All Events
      </Text>

      <Text style={styles.message}>
        No history found.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  filter: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },

  message: {
    fontSize: 16,
    color: "#555",
  },
});