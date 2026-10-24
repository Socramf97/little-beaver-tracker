import { useState } from "react";

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Manual Feeding Entry
      </Text>

      <TextInput
        placeholder="Feeding Type"
        value={feedingType}
        onChangeText={setFeedingType}
      />

      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
      />

      <Button
        title="Save Feeding"
        onPress={() => {
          console.log(feedingType);
          console.log(amount);
        }}
      />
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
});
