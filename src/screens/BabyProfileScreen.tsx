// Baby profile management screen

import { useEffect, useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import {
  Baby,
  createBaby,
  getAllBabies,
} from "../../services/database/babies";
import { useActiveBaby } from "../hooks/useActiveBaby";

export default function BabyProfilesScreen() {

const [babyName, setBabyName] = useState("");

const [babies, setBabies] = useState<Baby[]>([]);

// Access the currently selected baby so other screens can
// use the same selection throughout the app.
const { activeBaby, setActiveBaby } = useActiveBaby();

useEffect(() => {
  async function initializeBabies() {
    const allBabies = await getAllBabies();
    setBabies(allBabies);
  }

  initializeBabies();
}, []);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>
         Baby Profiles
      </Text>

      <Text style={styles.note}>
        Active Baby: {activeBaby ? activeBaby.name : "None Selected"}
      </Text>

      <Text style={styles.note}>
        Baby ID: {activeBaby ? activeBaby.id : "None"}
      </Text>

{babies.map((baby) => (
  <View key={baby.id} style={styles.babyCard}>
    <Text style={styles.sectionHeader}>
      {baby.name}
    </Text>

    <Button
      title="Select"
      onPress={() => setActiveBaby(baby)}
    />

    <Button
      title="Edit"
      onPress={() => {
        const newName = "Edited Baby";

        setBabies(
          babies.map((currentBaby) =>
            currentBaby.id === baby.id
              ? {
                  ...currentBaby,
                  name: newName,
                }
              : currentBaby
          )
        );
      }}
    />

    <Button
      title="Delete"
      onPress={() => {
        setBabies(
          babies.filter(
            (currentBaby) => currentBaby.id !== baby.id
          )
        );

        if (
          activeBaby &&
          activeBaby.id === baby.id
        ) {
          setActiveBaby(null);
        }
      }}
    />

  </View>
))}

<Text style={styles.sectionHeader}>
  Add New Baby
</Text>

<TextInput
  style={styles.input}
  placeholder="Enter baby name"
  value={babyName}
  onChangeText={setBabyName}
/>

<Button
  title="Create Baby"
  onPress={async () => {
    if (!babyName.trim()) return;

    const newBaby = {
      id: Date.now().toString(),
      name: babyName,
    };

    await createBaby(newBaby);

    const allBabies = await getAllBabies();
    setBabies(allBabies);

    setBabyName("");
  }}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },

  note: {
    fontSize: 16,
    color: "#555",
    marginVertical: 4,
  },

  babyCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    backgroundColor: "#fff",
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    width: "90%",
    backgroundColor: "#fff",
    marginVertical: 10,
  },

  sectionHeader: {
  fontSize: 22,
  fontWeight: "bold",
  marginBottom: 10,
},

});