// THIS IS TEMPORARY WILL DELETE LATER

import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export default function VoiceTestScreen() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  // we subscribe to events and listen and get back information

  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (e) => {
    setTranscript(e.results[0]?.transcript ?? "");
  });
  useSpeechRecognitionEvent("error", (e) => {
    console.log("error code:", e.error, "error message:", e.message);
    setError(`${e.error}: ${e.message}`);
  });

  const handleStart = async () => {
    setError("");
    // make sure we have permission
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

    if (!perm.granted) return setError("Permission denied");
    // start speech recognition
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
      // later if we wanted to add specific listening tools
      //   contextualStrings: ["Emma", "Liam", "formula", "ounces", "diaper"],
    });
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: "center" }}>
      <Pressable
        onPress={
          listening ? () => ExpoSpeechRecognitionModule.stop() : handleStart
        }
        style={{
          padding: 24,
          borderRadius: 16,
          backgroundColor: listening ? "#c33" : "#2a6",
        }}
      >
        <Text style={{ color: "white", fontSize: 20, textAlign: "center" }}>
          {listening ? "Stop" : "Hold on, I'm talking"}
        </Text>
      </Pressable>
      <Text style={{ fontSize: 18 }}>{transcript || "Say something…"}</Text>
      {error.length > 0 && <Text style={{ color: "red" }}>{error}</Text>}
    </View>
  );
}
