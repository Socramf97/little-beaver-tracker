// In continuous mode the recognizer never stops by itself, so we stop it ourselves
// after a pause. stop() makes it send the final result, then "end".
// The purpose of this function is to prevent the module from making a pause an error

import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import { useRef } from "react";

export const PAUSE_MS = 2000; // silence after talking = they're done
export const IDLE_MS = 15000; // nothing said at all = give up

export function useSilenceTimer() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  /** Stop listening after `ms` of silence (restarts the countdown each call). */
  function stopAfter(ms: number) {
    clear();
    timer.current = setTimeout(() => ExpoSpeechRecognitionModule.stop(), ms);
  }

  return { stopAfter, clear };
}
