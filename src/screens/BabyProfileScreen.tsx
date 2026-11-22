// Baby profile management screen

import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Button,
  Image,
  ScrollView,
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
import {
  listBabyPhotos,
  removePhoto
} from "../../services/database/photoStorage";

import {
  createPhotoAttachment
} from "../../services/database/photos";

import { useActiveBaby } from "../hooks/useActiveBaby";

export default function BabyProfilesScreen() {

// State used for creating, editing and managing baby profiles.
const [babyName, setBabyName] = useState("");

const [birthDate, setBirthDate] = useState("");

const [weightKg, setWeightKg] = useState("");

const [lengthCm, setLengthCm] = useState("");

const [headCircumferenceCm, setHeadCircumferenceCm] = useState("");

const [editingBabyId, setEditingBabyId] = useState<string | null>(null);

const [editedName, setEditedName] = useState("");

const [editedBirthDate, setEditedBirthDate] = useState("");

const [addingMeasurementId, setAddingMeasurementId] =
  useState<string | null>(null);

const [newWeight, setNewWeight] = useState("");

const [newLength, setNewLength] = useState("");

const [newHeadCircumference, setNewHeadCircumference] =
  useState("");

const [deleteConfirmationId, setDeleteConfirmationId] =
  useState<string | null>(null);

const [babies, setBabies] = useState<Baby[]>([]);

// Stores the latest measurement record for each baby.
// Keyed by baby ID.
const [latestMeasurements, setLatestMeasurements] =
  useState<Record<string, any>>({});

// Access the currently selected baby so other screens can
// use the same selection throughout the app.
const { activeBaby, setActiveBaby } = useActiveBaby();

// Stores photos associated with each baby profile.
// Keyed by baby ID.
const [babyPhotos, setBabyPhotos] =
  useState<Record<string, any[]>>({});

// Load baby profiles, latest measurements, and photos when screen first opens.
useEffect(() => {
  async function initializeBabies() {
    try {
      const allBabies = await getAllBabies();

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

      const photosMap: Record<string, any[]> = {};

      for (const baby of allBabies) {
        photosMap[baby.id] =
          await listBabyPhotos(baby.id);
      }

      setBabyPhotos(photosMap);

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionHeader}>
         Baby Profiles
      </Text>

      <Text style={styles.note}>
        Active Baby: {activeBaby ? activeBaby.name : "None Selected"}
      </Text>

      {activeBaby && (
        <Button
          title="Clear Active Baby"
          onPress={() => setActiveBaby(null)}
        />
      )}

      <Text style={styles.note}>
        Baby ID: {activeBaby ? activeBaby.id : "None"}
      </Text>

{/* Display each baby profile and its related information */}
{babies.map((baby) => (
  <View key={baby.id} style={styles.babyCard}>
    <Text style={styles.sectionHeader}>
      {baby.name}
    </Text>

    <Text style={styles.note}>
      Birth Date: {baby.birth_date ?? "Not Set"}
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

{/* Display saved photos associated with this baby profile. */}
{babyPhotos[baby.id]?.map((photo) => (
  <View key={photo.id}>
    <Image
      source={{ uri: photo.file_uri }}
      style={{
        width: 120,
        height: 120,
        marginVertical: 5,
      }}
    />

    <Button
      title="Delete Photo"
      onPress={async () => {
        await removePhoto(photo.id);

        const updatedPhotos =
          await listBabyPhotos(baby.id);

        setBabyPhotos({
          ...babyPhotos,
          [baby.id]: updatedPhotos,
        });
      }}
    />
  </View>
))}

{/* Edit mode allows updating a baby's name and birth date. */}
{editingBabyId === baby.id && (
  <>
    <TextInput
      style={styles.input}
      value={editedName}
      onChangeText={setEditedName}
      placeholder="Enter new baby name"
    />

    <TextInput
      style={styles.input}
      value={editedBirthDate}
      onChangeText={setEditedBirthDate}
      placeholder="Birth Date (YYYY-MM-DD)"
    />

    <Button
      title="Save"
      onPress={async () => {
        if (!editedName.trim()) return;

        if (
          editedBirthDate &&
          !/^\d{4}-\d{2}-\d{2}$/.test(
            editedBirthDate
          )
        ) {
          alert(
            "Please enter birth date as YYYY-MM-DD"
          );

          return;
        }

        await updateBaby(
          baby.id,
          editedName,
          editedBirthDate || null
        );

        const allBabies = await getAllBabies();

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

        setEditingBabyId(null);
        setEditedName("");
        setEditedBirthDate("");
      }}
    />

    <Button
      title="Cancel"
      onPress={() => {
        setEditingBabyId(null);
        setEditedName("");
        setEditedBirthDate("");
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
          setEditedBirthDate(
            baby.birth_date ?? ""
          );
        }}
      />
    )}

    {/* Add measurement entry for the selected baby. */}
    {addingMeasurementId !== baby.id && (
      <Button
        title="Add Measurement"
        onPress={() => {
          setAddingMeasurementId(baby.id);
        }}
      />
    )}

    {addingMeasurementId === baby.id && (
  <>
    <TextInput
      style={styles.input}
      placeholder="Weight (kg)"
      value={newWeight}
      onChangeText={setNewWeight}
    />

    <TextInput
      style={styles.input}
      placeholder="Length (cm)"
      value={newLength}
      onChangeText={setNewLength}
    />

    <TextInput
      style={styles.input}
      placeholder="Head Circumference (cm)"
      value={newHeadCircumference}
      onChangeText={setNewHeadCircumference}
    />

    <Button
      title="Save Measurement"
      onPress={async () => {
        if (
          !newWeight &&
          !newLength &&
          !newHeadCircumference
        ) {
          return;
        }

        if (
          (newWeight && Number(newWeight) <= 0) ||
          (newLength && Number(newLength) <= 0) ||
          (newHeadCircumference &&
            Number(newHeadCircumference) <= 0)
        ) {
          alert(
            "Measurements must be greater than zero"
          );

          return;
        }
        await createMeasurement({
          id: Date.now().toString(),
          baby_id: baby.id,
          weight_kg: newWeight
            ? Number(newWeight)
            : null,
          length_cm: newLength
            ? Number(newLength)
            : null,
          head_circumference_cm:
            newHeadCircumference
              ? Number(newHeadCircumference)
              : null,
        });

        const measurements =
          await getMeasurementsByBaby(baby.id);

        if (measurements.length > 0) {
          setLatestMeasurements({
            ...latestMeasurements,
            [baby.id]: measurements[0],
          });
        }

        setAddingMeasurementId(null);
        setNewWeight("");
        setNewLength("");
        setNewHeadCircumference("");
      }}
    />

    <Button
      title="Cancel"
      onPress={() => {
        setAddingMeasurementId(null);
        setNewWeight("");
        setNewLength("");
        setNewHeadCircumference("");
      }}
    />
  </>
)}
    {/* Select and attach a photo to the current baby profile. */}
    <Button
      title="Add Photo"
      onPress={async () => {
        const result =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });

        if (result.canceled) {
          return;
        }

        await createPhotoAttachment({
          id: Date.now().toString(),
          baby_id: baby.id,
          file_uri: result.assets[0].uri,
        });

        const updatedPhotos =
          await listBabyPhotos(baby.id);

        setBabyPhotos({
          ...babyPhotos,
          [baby.id]: updatedPhotos,
        });
      }}
    />
    {/* Confirm before permanently deleting a baby profile. */}
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

{/* Form used to create a new baby profile and optional measurement record. */}
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
  placeholder="Birth Date (YYYY-MM-DD)"
  value={birthDate}
  onChangeText={setBirthDate}
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

<Text style={styles.note}>
  Measurements are optional and can be added or updated later.
</Text>

{/* Validate user input, create baby profile, and save initial measurement if provided. */}
<Button
  title="Create Baby"
  onPress={async () => {
    if (!babyName.trim()) {
      alert("Please enter a baby name");
      return;
    }

    if (!birthDate.trim()) {
      alert("Please enter a birth date");
      return;
    }

    if (
      birthDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        birthDate
      )
    ) {
      alert(
        "Please enter birth date as YYYY-MM-DD"
      );

      return;
    }

    if (
      (weightKg && Number(weightKg) <= 0) ||
      (lengthCm && Number(lengthCm) <= 0) ||
      (headCircumferenceCm &&
        Number(headCircumferenceCm) <= 0)
    ) {
      alert(
        "Measurements must be greater than zero"
      );

      return;
    }

    const newBaby = {
      id: Date.now().toString(),
      name: babyName,
      birth_date: birthDate || null,
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
    setBirthDate("");
    setWeightKg("");
    setLengthCm("");
    setHeadCircumferenceCm("");
  }}
/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
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