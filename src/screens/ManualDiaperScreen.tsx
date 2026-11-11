import { validateEvent } from "@/features/events/validation";
import { useState } from "react";

import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ManualDiaperScreen() {
  const [diaperType, setDiaperType] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Manual Diaper Entry
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Diaper Type (pee, poop, both)"
        value={diaperType}
        onChangeText={setDiaperType}
      />

      <TextInput
        style={styles.input}
        placeholder="Notes"
        value={notes}
        onChangeText={setNotes}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Save Diaper Event"
          onPress={() => {
            try {
              validateEvent({
                kind: "diaper",
                babyId: "test-baby",
                diaperType,
                notes,
                timestamp: new Date(),
              });

              alert("Diaper event validated successfully!");

              console.log("Diaper Type:", diaperType);
              console.log("Notes:", notes);

          } catch (error) {
            if (error instanceof Error) {
              alert(error.message);
            } else {
              alert("Validation failed.");
            }
          }
        }}
        />
      </View>
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

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },

  buttonContainer: {
    marginTop: 10,
  },
});