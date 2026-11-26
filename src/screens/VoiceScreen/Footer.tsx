import type { Phase } from "@/features/voice/hooks/useSpeechToText";
import { VoiceSaveResult } from "@/features/voice/saveVoiceCommand";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { MicButton } from "./MicButton";
import { styles } from "./Styles";

// One line of status text for each phase
const STATUS_TEXT: Record<Phase, string> = {
  starting: "Starting…",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "",
  stopped: "Tap the mic to talk",
};

export default function Footer({
  phase,
  onMicPress,
  result,
}: {
  phase: Phase;
  onMicPress: () => void;
  result: VoiceSaveResult["status"] | "gaveUp" | null;
}) {
  const showManualEntryButton =
    phase === "stopped" &&
    (result === "gaveUp" || result === "notUnderstood" || result === "failed");
  return (
    <View style={styles.footer}>
      <Text style={styles.status}>{STATUS_TEXT[phase]}</Text>
      {showManualEntryButton && (
        <Pressable
          onPress={() => router.replace("/home")}
          style={({ pressed }) => [
            styles.manualButton,
            pressed && styles.manualButtonPressed,
          ]}
        >
          <Text style={styles.manualButtonText}>Enter manually</Text>
        </Pressable>
      )}
      <MicButton
        size="small"
        isListening={phase === "listening"}
        onPress={onMicPress}
      />
    </View>
  );
}
