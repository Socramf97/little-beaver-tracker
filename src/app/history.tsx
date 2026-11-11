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

    <View style={styles.historyCard}>
      <Text style={styles.message}>
        No history found yet.
      </Text>

      <Text style={styles.description}>
        Feeding and diaper history will appear here once events are recorded.
      </Text>
</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#F8F6F1",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6B4423",
    marginBottom: 20,
  },

  filter: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },

  message: {
    fontSize: 16,
    color: "#555",
  },

  historyCard: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
},

description: {
  color: "#666",
  textAlign: "center",
  marginTop: 10,
},

});