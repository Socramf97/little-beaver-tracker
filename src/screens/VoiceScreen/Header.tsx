import { Pressable, Text, View } from "react-native";
import { styles } from "./Styles";

export function Header({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.grabber} />
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityLabel="Close"
        style={styles.closeButton}
      >
        <Text style={styles.close}>✕</Text>
      </Pressable>
    </View>
  );
}
