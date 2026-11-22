import { useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  getEventHistory,
  HistoryEvent,
} from "../../services/database/history";
import { deleteEvent } from "../features/events/eventServices";
import { useActiveBaby } from "../hooks/useActiveBaby";

export default function HistoryScreen() {
  const { activeBaby } = useActiveBaby();

  console.log("Active Baby:", activeBaby);

  // Stores the events returned from the history service.
  const [events, setEvents] = useState<HistoryEvent[]>([]); 

  const [deleteConfirmationId, setDeleteConfirmationId] =
  useState<string | null>(null);
  
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

      <ScrollView
        contentContainerStyle={styles.container}
      >
      <Text style={styles.title}>
        Event History
      </Text>

      <Text style={styles.filter}>
        {activeBaby
          ? `${activeBaby.name}'s Events`
          : "No Baby Selected"}
      </Text>

    <View style={styles.historyCard}>
      {events.length === 0 && (
        <Text style={styles.note}>
          No events recorded yet.
        </Text>
      )}
      
      {events.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <Text style={styles.message}>
            {event.event_type === "feeding"
              ? `${event.feeding_type?.charAt(0).toUpperCase()}${event.feeding_type?.slice(1)} Feeding`
              : event.event_type === "diaper"
              ? `${event.diaper_type?.charAt(0).toUpperCase()}${event.diaper_type?.slice(1)} Diaper`
              : "Measurement"}
            </Text>

          <Text style={styles.message}>
            {event.event_type === "feeding" &&
            event.amount !== null && (
              <Text style={styles.message}>
                {event.amount} {event.unit ?? ""}
              </Text>
            )}

            {event.event_type === "diaper" &&
            event.notes && (
              <Text style={styles.message}>
                {event.notes}
              </Text>
            )}

            {event.event_type === "measurement" && (
              <Text style={styles.message}>
                Weight: {event.weight_kg ?? "--"} kg | Length: {event.length_cm ?? "--"} cm | Head: {event.head_circumference_cm ?? "--"} cm
              </Text>
            )}

          </Text>

          <Text style={styles.message}>
            {new Date(event.timestamp).toLocaleString()}
          </Text>

          {deleteConfirmationId === event.id ? (
          <>
            <Text style={styles.message}>
            Are you sure you want to delete this entry?
            </Text>

            <Button
            title="Yes Delete"
            onPress={async () => {
              try {
              await deleteEvent(
                event.event_type,
                event.id
              );

              if (activeBaby) {
                const history =
                await getEventHistory({
                  babyId: activeBaby.id,
                });

                setEvents(history);
              }

              setDeleteConfirmationId(null);
              } catch (error) {
              alert("Failed to delete entry.");
              }
            }}
            />

            <Button
            title="Cancel"
            onPress={() =>
              setDeleteConfirmationId(null)
            }
            />
          </>
          ) : (
          <Button
            title="Delete Entry"
            onPress={() =>
            setDeleteConfirmationId(event.id)
            }
          />
          )}

        </View>
      ))}

</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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