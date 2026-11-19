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
  deleteBaby,
  getAllBabies,
  updateBaby,
} from "../../services/database/babies";
import { createMeasurement, getMeasurementsByBaby } from "../../services/database/measurements";
import { useActiveBaby } from "../hooks/useActiveBaby";

export default function BabyProfilesScreen() {

const [babyName, setBabyName] = useState("");

const [weightKg, setWeightKg] = useState("");

const [lengthCm, setLengthCm] = useState("");

const [headCircumferenceCm, setHeadCircumferenceCm] = useState("");

const [editingBabyId, setEditingBabyId] = useState<string | null>(null);

const [editedName, setEditedName] = useState("");

const [deleteConfirmationId, setDeleteConfirmationId] =
  useState<string | null>(null);

const [babies, setBabies] = useState<Baby[]>([]);

const [latestMeasurements, setLatestMeasurements] =
  useState<Record<string, any>>({});

// Access the currently selected baby so other screens can
// use the same selection throughout the app.
const { activeBaby, setActiveBaby } = useActiveBaby();

useEffect(() => {
  async function initializeBabies() {
    try {
      const allBabies = await getAllBabies();

      console.log("Babies loaded:", allBabies);

      setBabies(allBabies);

      const measurementsMap: Record<string, any> = {};

      for (const baby of allBabies) {
        const measurements =
          await getMeasurementsByBaby(baby.id);

        if (measurements.length > 0) {
          measurementsMap[baby.id] =
            measurements[0];
        }
      }

      setLatestMeasurements(measurementsMap);

    } catch (error) {
      console.error(
        "Failed loading babies:",
        error
      );
    }
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

{latestMeasurements[baby.id] && (
  <>
    <Text style={styles.note}>
      Weight: {latestMeasurements[baby.id].weight_kg ?? "--"} kg
    </Text>

    <Text style={styles.note}>
      Length: {latestMeasurements[baby.id].length_cm ?? "--"} cm
    </Text>

    <Text style={styles.note}>
      Head Circumference: {latestMeasurements[baby.id].head_circumference_cm ?? "--"} cm
    </Text>

    <Text style={styles.note}>
      Recorded:
      {" "}
      {new Date(
        latestMeasurements[baby.id].timestamp
      ).toLocaleDateString()}
    </Text>

  </>
)}

{editingBabyId === baby.id && (
  <>
    <TextInput
      style={styles.input}
      value={editedName}
      onChangeText={setEditedName}
      placeholder="Enter new baby name"
    />

    <Button
      title="Save"
      onPress={async () => {
        if (!editedName.trim()) return;

        await updateBaby(
          baby.id,
          editedName
        );

        const allBabies = await getAllBabies();

        setBabies(allBabies);

        const measurementsMap: Record<string, any> = {};

        for (const baby of allBabies) {
          const measurements =
            await getMeasurementsByBaby(baby.id);

          console.log(
            "Measurements for",
            baby.name,
            measurements
          );

          if (measurements.length > 0) {
            measurementsMap[baby.id] =
              measurements[0];
          }
        }

        console.log(
          "Measurements map:",
          measurementsMap
        );

        setLatestMeasurements(measurementsMap);

        setEditingBabyId(null);
        setEditedName("");
      }}
    />

    <Button
      title="Cancel"
      onPress={() => {
        setEditingBabyId(null);
        setEditedName("");
      }}
    />

  </>
)}

    <Button
      title="Select"
      onPress={() => setActiveBaby(baby)}
    />

    {editingBabyId !== baby.id &&
    deleteConfirmationId !== baby.id && (

    <Button
      title="Edit"
      onPress={() => {
        setEditingBabyId(baby.id);
        setEditedName(baby.name);
      }}
    />
  )}

    {deleteConfirmationId === baby.id && (
  <>
    <Text style={styles.note}>
      Are you sure you want to delete {baby.name}?
    </Text>

    <Button
      title="Yes Delete"
      onPress={async () => {
        await deleteBaby(baby.id);

        const allBabies =
          await getAllBabies();

        setBabies(allBabies);

        const measurementsMap: Record<string, any> = {};

        for (const baby of allBabies) {
          const measurements =
            await getMeasurementsByBaby(baby.id);

          if (measurements.length > 0) {
            measurementsMap[baby.id] =
              measurements[0];
          }
        }

        setLatestMeasurements(measurementsMap);

        if (
          activeBaby &&
          activeBaby.id === baby.id
        ) {
          setActiveBaby(null);
        }

        setDeleteConfirmationId(null);
      }}
    />

    <Button
      title="Cancel"
      onPress={() => {
        setDeleteConfirmationId(null);
      }}
    />
  </>
)}

    {deleteConfirmationId !== baby.id && (
    <Button
      title="Delete"
      onPress={() => {
        setDeleteConfirmationId(baby.id);
      }}
    />
  )}

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

<TextInput
  style={styles.input}
  placeholder="Weight in kilograms (e.g., 3.5)"
  value={weightKg}
  onChangeText={setWeightKg}
/>

<TextInput
  style={styles.input}
  placeholder="Length in centimeters (e.g., 50)"
  value={lengthCm}
  onChangeText={setLengthCm}
/>

<TextInput
  style={styles.input}
  placeholder="Head Circumference in centimeters (e.g., 34)"
  value={headCircumferenceCm}
  onChangeText={setHeadCircumferenceCm}
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

    if (
      weightKg ||
      lengthCm ||
      headCircumferenceCm
    ) {
      await createMeasurement({
        id: Date.now().toString() + "-measurement",
        baby_id: newBaby.id,
        weight_kg: weightKg
          ? Number(weightKg)
          : null,
        length_cm: lengthCm
          ? Number(lengthCm)
          : null,
        head_circumference_cm:
          headCircumferenceCm
            ? Number(headCircumferenceCm)
            : null,
      });
    }

    const allBabies = await getAllBabies();

    const measurementsMap: Record<string, any> = {};

    for (const baby of allBabies) {
      const measurements =
        await getMeasurementsByBaby(baby.id);

      if (measurements.length > 0) {
        measurementsMap[baby.id] =
          measurements[0];
      }
    }

    setLatestMeasurements(measurementsMap);

    setBabies(allBabies);

    setBabyName("");
    setWeightKg("");
    setLengthCm("");
    setHeadCircumferenceCm("");
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