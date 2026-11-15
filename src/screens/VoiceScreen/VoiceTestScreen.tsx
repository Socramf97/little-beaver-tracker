import { useSpeechToText } from "@/features/voice/hooks/useSpeechToText";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { Conversation } from "./Conversation";
import EmptyState from "./EmptyState";
import Footer from "./Footer";
import { Header } from "./Header";
import { styles } from "./Styles";

import Toast from "react-native-toast-message";

export default function VoiceTestScreen() {
  const router = useRouter();
  const closed = useRef(false);

  const {
    transcript,
    error,
    phase,
    toggleListening,
    abortListening,
    startNewCommand,
    messages,
    result,
  } = useSpeechToText();

  useEffect(() => {
    let cancelled = false;
    startNewCommand(() => !cancelled);
    return () => {
      cancelled = true;
      abortListening();
    };
  }, []);

  useEffect(() => {
    if (phase !== "stopped" || result !== "saved" || closed.current) {
      return;
    }
    closed.current = true;

    const msg = messages[messages.length - 1]?.text ?? "Saved!";

    router.back();

    Toast.show({
      type: "success",
      text1: msg,
      visibilityTime: 8000,
    });
  }, [phase, result, router, messages]);

  function onClose() {
    abortListening();
    router.back();
  }

  const isEmpty = messages.length === 0 && transcript === "";

  return (
    <View style={styles.sheet}>
      <Header onClose={onClose} />

      {isEmpty ? (
        <EmptyState
          isListening={phase === "listening"}
          onMicPress={toggleListening}
        />
      ) : (
        <>
          <Conversation
            messages={messages}
            transcript={transcript}
            phase={phase}
          />
          <Footer phase={phase} onMicPress={toggleListening} result={result} />
        </>
      )}

      {error !== "" && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
