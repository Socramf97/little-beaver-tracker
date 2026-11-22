// Voice recognition screen used to test and interact with
// the application's speech-to-text functionality.

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useActiveBaby } from "../hooks/useActiveBaby";
import { sharedStyles } from "../styles/sharedStyles";

export default function VoiceTestScreen() {

  const { activeBaby } = useActiveBaby();
  
  // Tracks speech recognition status, recognized text,
  // and any errors returned by the speech engine.
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  // Subscribe to speech recognition events and update
  // the interface as speech recognition starts, stops,
  // returns results, or encounters errors.

  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (e) => {
    setTranscript(e.results[0]?.transcript ?? "");
  });
  useSpeechRecognitionEvent("error", (e) => {
    console.log("error code:", e.error, "error message:", e.message);
    setError(`${e.error}: ${e.message}`);
  });

  // Request microphone permission and start
  // a new speech recognition session.
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
    <View style={sharedStyles.container}>

      <Text style={sharedStyles.title}>
        Voice Assistant
      </Text>

      <Text>
        {activeBaby
          ? `Current Baby: ${activeBaby.name}`
          : "No Baby Selected"}
      </Text>

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
          {listening ? "Stop Listening" : "Start Listening"}
        </Text>
      </Pressable>

      <Text style={{ fontWeight: "bold" }}>
        Recognized Speech
      </Text>

      <Text style={{ fontSize: 18 }}>{transcript || "Say something…"}</Text>
      {error.length > 0 && <Text style={{ color: "red" }}>{error}</Text>}
    </View>
  );
}
