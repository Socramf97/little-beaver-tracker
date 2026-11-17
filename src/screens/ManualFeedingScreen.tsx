import { Picker } from '@react-native-picker/picker';
import { useState } from "react";
import { createEvent } from "../features/events/eventServices";
import { sharedStyles } from "../styles/sharedStyles";


import {
  Button,
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
    <View style={sharedStyles.container}>
      <Text style={sharedStyles.title}>
        Manual Feeding Entry
      </Text>

      <Picker
        selectedValue={feedingType}
        onValueChange={(itemValue) => setFeedingType(itemValue)}
      >
        <Picker.Item label="Select Feeding Type" value="" />
        <Picker.Item label="Breast" value="breast" />
        <Picker.Item label="Bottle" value="bottle" />
        <Picker.Item label="Formula" value="formula" />
      </Picker>

      <TextInput
        style={sharedStyles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
      />

      <Picker
        selectedValue={unit}
        onValueChange={(itemValue) => setUnit(itemValue)}
      >
        <Picker.Item label="Select Unit" value="" />
        <Picker.Item label="oz" value="oz" />
        <Picker.Item label="mL" value="mL" />
      </Picker>

      <TextInput
        style={sharedStyles.input}
        placeholder="Notes"
        value={notes}
        onChangeText={setNotes}
      />

      <View style={sharedStyles.buttonContainer}>
        <Button
          title="Save Feeding"
          onPress={async () => {
  try {
    console.log("feedingType =", feedingType);
    console.log("amount =", amount);
    console.log("unit =", unit);
    console.log("notes =", notes);
    await createEvent({
      kind: "feeding",
      babyId: "test-baby",
      feedingType,
      amount: amount.trim()
        ? Number(amount)
        : undefined,
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