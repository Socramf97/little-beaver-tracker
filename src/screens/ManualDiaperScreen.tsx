import { createEvent } from "@/features/events/eventServices";
import { Picker } from '@react-native-picker/picker';
import { useState } from "react";
import { EventValidationError } from "../features/events/validation";
import { useActiveBaby } from "../hooks/useActiveBaby";
import { sharedStyles } from "../styles/sharedStyles";

import {
  Button,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ManualDiaperScreen() {
  // State used to capture manual diaper event details.
  const [diaperType, setDiaperType] = useState("");
  const [notes, setNotes] = useState("");
  
  // Use the currently selected baby so diaper entries
  // are saved to the correct profile throughout the app.
  const { activeBaby } = useActiveBaby();

  return (
    <View style={sharedStyles.container}>
      <Text style={sharedStyles.title}>
        Manual Diaper Entry
      </Text>

     {/* Diaper type selection */}
     <Picker
        selectedValue={diaperType}
        onValueChange={(itemValue) => setDiaperType(itemValue)}
      >
        <Picker.Item label="Select Diaper Type" value="" />
        <Picker.Item label="Pee" value="pee" />
        <Picker.Item label="Poop" value="poop" />
        <Picker.Item label="Both" value="both" />
      </Picker>

      <TextInput
        style={sharedStyles.input}
        placeholder="Notes"
        value={notes}
        onChangeText={setNotes}
      />

      <View style={sharedStyles.buttonContainer}>
        {/* Validate input and create a diaper event for the active baby. */}
        <Button
          title="Save Diaper Event"
          onPress={async () => {
            try {
              // A diaper event should always belong to a baby profile.
              // Prevent saving until a baby has been selected.
              if (!activeBaby) {
                alert("Please select a baby profile first.");
                return;
              }
              await createEvent({
                kind: "diaper",
                babyId: activeBaby.id,
                diaperType,
                notes,
                timestamp: new Date(),
              });

              alert("Diaper event saved successfully!");
          } catch (error) {
            if (error instanceof EventValidationError) {
              alert(error.errors[0].message);
            } else if (error instanceof Error) {
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