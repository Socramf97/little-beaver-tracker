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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Baby Profiles
      </Text>

      <Text style={styles.note}>
  Active Baby: None Selected
</Text>

<Text style={styles.note}>
  --------------------
</Text>

<Text style={styles.note}>
  Baby Profiles
</Text>

<Text style={styles.note}>
  No profiles found.
</Text>

<Text style={styles.note}>
  --------------------
</Text>

<Text style={styles.note}>
  Add New Baby
</Text>
<TextInput
  placeholder="Enter baby name"
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