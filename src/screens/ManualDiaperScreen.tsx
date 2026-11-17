import { createEvent } from "@/features/events/eventServices";
import { Picker } from '@react-native-picker/picker';
import { useState } from "react";
import { sharedStyles } from "../styles/sharedStyles";

import {
  Button,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ManualDiaperScreen() {
  const [diaperType, setDiaperType] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <View style={sharedStyles.container}>
      <Text style={sharedStyles.title}>
        Manual Diaper Entry
      </Text>

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
        <Button
          title="Save Diaper Event"
          onPress={async () => {
            try {
              await createEvent({
                kind: "diaper",
                babyId: "test-baby",
                diaperType,
                notes,
                timestamp: new Date(),
              });

              alert("Diaper event saved successfully!");

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