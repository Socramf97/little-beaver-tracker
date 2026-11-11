// Baby profile management screen

import { useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

export default function BabyProfilesScreen() {

const [babyName, setBabyName] = useState("");

const [babies, setBabies] = useState([
  { id: "1", name: "Kelly" },
  { id: "2", name: "Blake" },
]);

const [activeBaby, setActiveBaby] = useState<any>(null);

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
      title="Delete"
      onPress={() => {
        if (
          confirm("Are you sure you want to delete this baby profile?")
      ) {
        setBabies(
          babies.filter(
            (currentBaby) =>
              currentBaby.id !== baby.id
          )
        );
      }
    }}
    />
    <Button
      title="Edit"
      onPress={() => {
        const updatedBabies = babies.map(
      (currentBaby) =>
      currentBaby.id === baby.id
        ? {
            ...currentBaby,
            name: currentBaby.name + " (Edited)",
          }
      : currentBaby
    );

    setBabies(updatedBabies);
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
  onPress={() => {
    if (!babyName.trim()) return;

    setBabies([
  ...babies,
  {
    id: Date.now().toString(),
    name: babyName,
  },
]);


    setBabyName("");

    console.log(babyName);
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