import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import WakeWord from "./src/WakeWordModule";

export type WakeWordStatus =
  | "idle"
  | "starting"
  | "listening"
  | "stopping"
  | "denied"
  | "error";

type Detection = { name: string; confidence: number };

type Options = {
  // this will be the function what happens once we detect it
  onDetect: (detection: Detection) => void;
  enabled?: boolean;
};
export function useWakeWord({ onDetect, enabled = true }: Options) {
  const [status, setStatus] = useState<WakeWordStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const onDetectRef = useRef(onDetect);

  // 1. Subscribe to detection events once.
  useEffect(() => {
    const sub = WakeWord.addListener("onWakeWord", (e) =>
      onDetectRef.current(e),
    );

    return () => sub.remove();
  }, []);

  // 2. start
  const start = useCallback(async () => {
    const granted = await WakeWord.requestMicPermission();
    setError(null);
    if (!granted) {
      setStatus("denied");
      return;
    }
    setStatus("starting");
    try {
      await WakeWord.startListening();
      setStatus("listening");
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setStatus("error");
    }
  }, []);

  // 3. stop
  const stop = useCallback(async () => {
    setStatus("stopping");
    await WakeWord.stopListening();
    setStatus("idle");
  }, []);

  // 4. Run while we are actively in the app or inactive
  // Stop if we put the app in background

  useEffect(() => {
    if (!enabled) return;

    // start() syncs with an external system (the native mic); its setState calls
    // happen after awaiting native responses, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start();

    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") start();
      else if (next === "background") stop();
    });

    return () => {
      sub.remove();
      stop();
    };
  }, [enabled, start, stop]);

  return { status, error, start, stop };
}
