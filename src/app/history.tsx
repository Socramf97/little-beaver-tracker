import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  getEventHistory,
  HistoryEvent,
} from "../../services/database/history";
import { deleteEvent, updateEvent } from "../features/events/eventServices";
import { useActiveBaby } from "../hooks/useActiveBaby";

export default function HistoryScreen() {
  const { activeBaby } = useActiveBaby();

  // State the events returned from the history service.
  const [events, setEvents] = useState<HistoryEvent[]>([]); 

  // State used for editing and deleting history entries.
  const [deleteConfirmationId, setDeleteConfirmationId] =
  useState<string | null>(null);

  const [editingEventId, setEditingEventId] =
  useState<string | null>(null);

  const [editFeedingType, setEditFeedingType] =
  useState("");

  const [editUnit, setEditUnit] =
  useState("");

  const [editNotes, setEditNotes] =
  useState("");

  const [editDiaperType, setEditDiaperType] =
  useState("");

  const [editValue, setEditValue] =
  useState("");

  const [editWeight, setEditWeight] =
  useState("");

  const [editLength, setEditLength] =
  useState("");

  const [editHeadCircumference, setEditHeadCircumference] =
  useState("");
  
  // Load the selected baby's event history whenever active baby profile changes.
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
      
      {/* Display all recorded events for the active baby. */}
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

          {/* Show event-specific editing controls for feedings, diapers, and measurements. */}
          {editingEventId === event.id && (

          <>
            {/* Feeding event editor. */}
            {event.event_type === "feeding" && (
            <>

              <Picker
                selectedValue={editFeedingType}
                onValueChange={(itemValue) =>
                  setEditFeedingType(itemValue)
                }
                >
                <Picker.Item
                  label="Breast"
                  value="breast"
                />
                <Picker.Item
                  label="Bottle"
                  value="bottle"
                />
                <Picker.Item
                  label="Formula"
                  value="formula"
                />
                </Picker>

              <TextInput
              style={styles.input}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="Amount"
              />

              <Picker
                selectedValue={editUnit}
                onValueChange={(itemValue) =>
                  setEditUnit(itemValue)
                }
                >
                <Picker.Item
                  label="oz"
                  value="oz"
                />
                <Picker.Item
                  label="mL"
                  value="mL"
                />
                </Picker>

                <TextInput
                  style={styles.input}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Notes"
                  />

              <Button
              title="Save Edit"
              onPress={async () => {
                try {
                await updateEvent(event.id, {
                  kind: "feeding",
                  babyId: event.baby_id,
                  feedingType: editFeedingType,
                  amount: Number(editValue),
                  unit: editUnit,
                  notes: editNotes,
                  timestamp: new Date(event.timestamp),
                });

                const history =
                  await getEventHistory({
                  babyId: activeBaby!.id,
                  });

                setEvents(history);
                setEditingEventId(null);
                setEditValue("");
                } catch (error) {
                alert("Failed to update entry.");
                }
              }}
              />

              <Button
              title="Cancel Edit"
              onPress={() => {
                setEditingEventId(null);
                setEditValue("");
              }}
              />
            </>
            )}
            {/* Diaper event editor. */}
            {event.event_type === "diaper" && (
            <>
              <Picker
              selectedValue={editDiaperType}
              onValueChange={(itemValue) =>
                setEditDiaperType(itemValue)
              }
              >
              <Picker.Item
                label="Pee"
                value="pee"
              />

              <Picker.Item
                label="Poop"
                value="poop"
              />

              <Picker.Item
                label="Both"
                value="both"
              />
              </Picker>

              <TextInput
              style={styles.input}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Notes"
              />

              <Button
              title="Save Edit"
              onPress={async () => {
                try {
                await updateEvent(event.id, {
                  kind: "diaper",
                  babyId: event.baby_id,
                  diaperType: editDiaperType,
                  notes: editNotes,
                  timestamp: new Date(event.timestamp),
                });

                const history =
                  await getEventHistory({
                  babyId: activeBaby!.id,
                  });

                setEvents(history);

                setEditingEventId(null);

                setEditNotes("");
                setEditDiaperType("");

                } catch (error) {
                alert("Failed to update entry.");
                }
              }}
              />

              <Button
              title="Cancel Edit"
              onPress={() => {
                setEditingEventId(null);
                setEditNotes("");
                setEditDiaperType("");
              }}
              />
            </>
            )}

            {/* Measurement event editor. */}
            {event.event_type === "measurement" && (
            <>
              <TextInput
              style={styles.input}
              value={editWeight}
              onChangeText={setEditWeight}
              placeholder="Weight (kg)"
              />

              <TextInput
              style={styles.input}
              value={editLength}
              onChangeText={setEditLength}
              placeholder="Length (cm)"
              />

              <TextInput
              style={styles.input}
              value={editHeadCircumference}
              onChangeText={setEditHeadCircumference}
              placeholder="Head Circumference (cm)"
              />

              <Button
              title="Save Edit"
              onPress={async () => {
                try {

                await updateEvent(event.id, {
                  kind: "measurement",
                  babyId: event.baby_id,
                  weightKg: editWeight
                  ? Number(editWeight)
                  : undefined,
                  lengthCm: editLength
                  ? Number(editLength)
                  : undefined,
                  headCircumferenceCm:
                  editHeadCircumference
                    ? Number(editHeadCircumference)
                    : undefined,
                  timestamp: new Date(event.timestamp),
                });

                const history =
                  await getEventHistory({
                  babyId: activeBaby!.id,
                  });

                setEvents(history);

                setEditingEventId(null);

                setEditWeight("");
                setEditLength("");
                setEditHeadCircumference("");

                } catch (error) {
                alert("Failed to update entry.");
                }
              }}
              />

              <Button
              title="Cancel Edit"
              onPress={() => {
                setEditingEventId(null);

                setEditWeight("");
                setEditLength("");
                setEditHeadCircumference("");
              }}
              />
            </>
            )}

            </>
            )}

          {/* Confirm before permanently deleting an event. */}
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
          <>
            {/* Populate editing fields with existing event values. */}
            <Button
              title="Edit Entry"
              onPress={() => {
                setEditingEventId(event.id);

                // Preload the current event values into the edit form.
                setEditValue(
                  event.amount?.toString() ?? ""
                );

                setEditFeedingType(
                  event.feeding_type ?? ""
                );

                setEditUnit(
                  event.unit ?? ""
                );

                setEditNotes(
                  event.notes ?? ""
                );

                setEditDiaperType(
                  event.diaper_type ?? ""
                  );

                setEditWeight(
                  event.weight_kg?.toString() ?? ""
                  );

                  setEditLength(
                  event.length_cm?.toString() ?? ""
                  );

                  setEditHeadCircumference(
                  event.head_circumference_cm?.toString() ?? ""
                  );
                }}
            />

            <Button
              title="Delete Entry"
              onPress={() =>
              setDeleteConfirmationId(event.id)
              }
            />
            </>
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

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginVertical: 5,
    backgroundColor: "#fff",
    },

});