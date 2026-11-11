import { useState } from "react";
import { validateEvent } from "../features/events/validation";

import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ManualFeedingScreen() {
  const [feedingType, setFeedingType] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Manual Feeding Entry
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Feeding Type"
        value={feedingType}
        onChangeText={setFeedingType}
      />

      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
      />

      <TextInput
        style={styles.input}
        placeholder="Unit (oz, ml, etc)"
        value={unit}
        onChangeText={setUnit}
      />

      <TextInput
        style={styles.input}
        placeholder="Notes"
        value={notes}
        onChangeText={setNotes}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Save Feeding"
          onPress={() => {
  try {
    validateEvent({
      kind: "feeding",
      babyId: "test-baby",
      feedingType,
      amount: Number(amount),
      unit,
      notes,
      timestamp: new Date(),
    });

    alert("Feeding validated successfully!");

    console.log("Feeding Type:", feedingType);
    console.log("Amount:", amount);
    console.log("Unit:", unit);
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