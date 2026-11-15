import { Pressable, Text, View } from "react-native";
import { styles } from "./Styles";

export function MicButton({
  size,
  isListening,
  onPress,
}: {
  size: "large" | "small";
  isListening: boolean;
  onPress: () => void;
}) {
  const d = size === "large" ? 96 : 60; // mic diameter
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isListening ? "Stop listening" : "Start listening"}
      style={[
        styles.ring,
        { width: d * 1.35, height: d * 1.35, borderRadius: d },
        isListening && styles.ringOn,
      ]}
    >
      <View
        style={[
          styles.mic,
          { width: d, height: d, borderRadius: d / 2 },
          isListening && styles.micOn,
        ]}
      >
        <Text style={{ fontSize: d * 0.4 }}>🎤</Text>
      </View>
    </Pressable>
  );
}
