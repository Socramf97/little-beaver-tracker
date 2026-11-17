import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  getEventHistory,
  HistoryEvent,
} from "../../services/database/history";
import { useActiveBaby } from "../hooks/useActiveBaby";

export default function HistoryScreen() {
  const { activeBaby } = useActiveBaby();

  console.log("Active Baby:", activeBaby);

  // Stores the events returned from the history service.
  const [events, setEvents] = useState<HistoryEvent[]>([]); 
  
  // Reload history whenever a different baby is selected.
useEffect(() => {
  async function loadHistory() {
    if (!activeBaby) {
      setEvents([]);
      return;
    }

    try {
      const history = await getEventHistory({
        babyId: activeBaby.id,
      });

      // Temporary log so we can verify history is being returned
      // before building the visual display.
      console.log("History Events:", history);

      setEvents(history);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }

  loadHistory();
}, [activeBaby]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Event History
      </Text>

      <Text style={styles.filter}>
        {activeBaby
          ? `${activeBaby.name}'s Events`
          : "No Baby Selected"}
      </Text>

    <View style={styles.historyCard}>
      {events.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <Text style={styles.message}>
            {event.event_type === "feeding"
              ? `${event.feeding_type} Feeding`
              : `${event.diaper_type} Diaper`}
          </Text>

          <Text style={styles.message}>
            {event.event_type === "feeding"
              ? `${event.amount ?? ""} ${event.unit ?? ""}`
              : event.notes ?? ""}
          </Text>

          <Text style={styles.message}>
            {new Date(event.timestamp).toLocaleString()}
          </Text>

        </View>
      ))}

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

  note: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },

  eventCard: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

});