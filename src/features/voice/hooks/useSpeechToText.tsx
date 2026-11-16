import { VoiceSaveResult } from "@/features/voice/saveVoiceCommand";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

import * as Speech from "expo-speech";

import { useRef, useState } from "react";
import { handleCommand } from "./handleCommand";
import {
  EMPTY_QUESTIONS,
  QuestionState,
  trackQuestion,
} from "./questionTracker";

import { BabyRef } from "../types";
import { IDLE_MS, PAUSE_MS, useSilenceTimer } from "./useSilenceTimer";

export type Phase =
  | "starting" // tap mic -> starting
  | "listening" // mic turns on -> listening
  | "thinking" // user stops talking -> thinking
  | "speaking" // app replies -> speaking
  | "stopped"; // app stops -> stopped

export type Message = {
  id: string;
  from: "user" | "app";
  text: string;
};

export function useSpeechToText(babies: BabyRef[]) {
  // --- STATES --- -> For the screen
  const [phase, setPhase] = useState<Phase>("starting");
  const [result, setResult] = useState<
    VoiceSaveResult["status"] | "gaveUp" | null
  >(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const isListening = phase === "listening";

  // --- Refs --- -> What the handlers check ALWAYS CURRENT NO RE-RENDERS WHEN UPDATED

  const nextMsgId = useRef(0);
  const fullCommand = useRef(""); // holds the FULL command if needed more info
  // const appResponse = useRef<string | null>(null); // HOLD the response after mic is off to send
  const micOn = useRef(false); // ONLY speak after the mic is OFF or might hear itself
  const listenAfterSpeaking = useRef(false); // IF we need to ask another question
  const questions = useRef<QuestionState>(EMPTY_QUESTIONS); // tracking how many times we ask the same question
  // --- HELPERS ---
  const silence = useSilenceTimer();

  function addMessage(from: Message["from"], text: string) {
    nextMsgId.current += 1;
    const id = String(nextMsgId.current);
    setMessages((prev) => [...prev, { id, from, text }]);
  }
  // When we want to restart EX: Finishing a command
  function resetCommand() {
    fullCommand.current = "";
    setMessages([]);
    listenAfterSpeaking.current = false;
    questions.current = EMPTY_QUESTIONS;
  }

  const handleStopListening = async () => {
    ExpoSpeechRecognitionModule.stop();
  };

  const handleStartListening = async (
    shouldContinue: () => boolean = () => true,
  ) => {
    setPhase("starting");
    setError("");
    setResult(null);
    // make sure we have permission
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

    if (!shouldContinue()) {
      return;
    }

    if (!perm.granted) {
      setPhase("stopped");
      return setError("Permission denied");
    }
    // start speech recognition
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: true,
    });
  };

  const startNewCommand = (shouldContinue: () => boolean = () => true) => {
    resetCommand();
    // setMessages([]);
    setResult(null);
    handleStartListening(shouldContinue);
  };

  const toggleListening = async () => {
    if (isListening) {
      handleStopListening();
    } else {
      handleStartListening();
    }
  };

  const abortListening = async () => {
    silence.clear();
    ExpoSpeechRecognitionModule.abort();
    Speech.stop();
    setPhase("stopped");
    micOn.current = false;
    resetCommand();
  };

  // we subscribe to events and listen and get back information
  // -- Subscribed Events ---

  // START EVENT
  useSpeechRecognitionEvent("start", () => {
    setPhase("listening");
    micOn.current = true;
    console.log("MIC ON");
    Speech.stop();
    silence.stopAfter(IDLE_MS);
  });

  // END EVENT
  useSpeechRecognitionEvent("end", () => {
    micOn.current = false;
    console.log("MIC OFF");
    silence.clear();
    setPhase((p) => (p === "listening" ? "stopped" : p));
  });

  // RESULT EVENT Happens BEFORE end event
  useSpeechRecognitionEvent("result", async (e) => {
    const text = e.results[0]?.transcript ?? "";
    setTranscript(text);

    if (!e.isFinal) {
      silence.stopAfter(PAUSE_MS);
      return;
    }
    silence.clear();
    ExpoSpeechRecognitionModule.abort();

    if (!text.trim()) {
      setTranscript("");
      setPhase("stopped");
      return;
    }

    setTranscript("");
    addMessage("user", text);
    setPhase("thinking");

    fullCommand.current = (fullCommand.current + " " + text).trim();

    const res = await handleCommand(fullCommand.current, babies);
    setResult(res.result.status);
    let reply = res.text;

    if (res.result?.status === "needsInfo") {
      const tracked = trackQuestion(questions.current, res.result.field);

      questions.current = tracked.state;

      if (tracked.stuck) {
        reply = "I'm having trouble with that. You can enter it manually.";
        setResult("gaveUp");
        resetCommand();
      } else {
        listenAfterSpeaking.current = true;
      }
    } else {
      resetCommand();
    }

    addMessage("app", reply);
    setPhase("speaking");

    Speech.speak(reply, {
      // we want to check IF we need more info IF so we turn the mic back on.
      onDone: () => {
        if (listenAfterSpeaking.current) {
          listenAfterSpeaking.current = false;
          handleStartListening();
        } else {
          setPhase((p) => (p === "speaking" ? "stopped" : p));
        }
      },
      onStopped: () => setPhase((p) => (p === "speaking" ? "stopped" : p)),
    });
  });

  // ERROR EVENT
  useSpeechRecognitionEvent("error", (e) => {
    console.log("error code:", e.error, "error message:", e.message);
    if (e.error === "aborted") return;
    setPhase("stopped");
    if (e.error === "no-speech") return;
    setError(`${e.error}: ${e.message}`);
  });

  return {
    transcript,
    error,
    phase,
    startNewCommand,
    toggleListening,
    abortListening,
    handleStartListening,
    messages,
    result,
  };
}
