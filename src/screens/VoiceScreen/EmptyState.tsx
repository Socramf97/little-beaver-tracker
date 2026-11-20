import { Text, View } from "react-native";
import { MicButton } from "./MicButton";
import { styles } from "./Styles";

const EXAMPLES = [
  '"Emma had 3 ounces of formula"',
  '"Liam had a wet diaper"',
  '"I nursed Emma"',
];

export default function EmptyState({
  isListening,
  onMicPress,
}: {
  isListening: boolean;
  onMicPress: () => void;
}) {
  return (
    <View style={styles.empty}>
      <MicButton size="small" isListening={isListening} onPress={onMicPress} />

      <Text style={styles.title}>
        {isListening ? "Listening…" : "Tap the mic to talk"}
      </Text>
      <Text style={styles.subtitle}>What would you like to log?</Text>

      <View style={styles.examples}>
        <Text style={styles.examplesLabel}>Try saying</Text>
        {EXAMPLES.map((example) => (
          <Text key={example} style={styles.example}>
            {example}
          </Text>
        ))}
      </View>
    </View>
  );
}
