import { useEffect, useState } from "react";
import { Button, ScrollView, Text } from "react-native";
import WakeWord from "../../modules/wake-word";

type Status = "idle" | "starting" | "listening" | "stopping";

export default function BridgeTest() {
  const [log, setLog] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  const add = (msg: string) =>
    setLog((l) =>
      [`${new Date().toLocaleTimeString()}  ${msg}`, ...l].slice(0, 15),
    );

  const handleStartListening = async () => {
    const ok = await WakeWord.requestMicPermission();
    if (!ok) return add("Mic permission denied");
    setStatus("starting");
    try {
      await WakeWord.startListening();
      add("started listening");
      setStatus("listening");
    } catch (error: any) {
      add(`${error.message}`);
      setStatus("idle");
    }
  };

  const handleStopListening = async () => {
    setStatus("stopping");
    add("stopping listening");
    await WakeWord.stopListening();
    add("idle now");
    setStatus("idle");
  };

  useEffect(() => {
    const sub = WakeWord.addListener("onWakeWord", (e) =>
      add(`🎤 HEARD "${e.name}" (${e.confidence.toFixed(2)})`),
    );

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 8, paddingTop: 80 }}>
      <Text>Status: {status}</Text>

      <Button
        title="Start Listening"
        disabled={status !== "idle"}
        onPress={() => handleStartListening()}
      />
      <Button
        title="Stop Listening"
        disabled={status !== "listening"}
        onPress={() => handleStopListening()}
      />

      {log.map((line, i) => (
        <Text key={i} style={{ fontFamily: "Menlo", fontSize: 12 }}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}
