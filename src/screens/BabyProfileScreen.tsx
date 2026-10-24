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
  "Kelly",
  "Blake",
]);
const [activeBaby, setActiveBaby] = useState("None Selected");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Baby Profiles
      </Text>

      <Text style={styles.note}>
  Active Baby: {activeBaby}
</Text>

<Text style={styles.note}>
  --------------------
</Text>

<Text style={styles.note}>
  Baby Profiles
</Text>

{babies.map((baby) => (
  <View key={baby}>
    <Text style={styles.note}>
      {baby}
    </Text>

    <Button
      title="Select"
      onPress={() => setActiveBaby(baby)}
    />
  </View>
))}

<Text style={styles.note}>
  --------------------
</Text>

<Text style={styles.note}>
  Add New Baby
</Text>
<TextInput
  placeholder="Enter baby name"
  value={babyName}
  onChangeText={setBabyName}
/>
<Button
  title="Create Baby"
  onPress={() => {
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
  },
});