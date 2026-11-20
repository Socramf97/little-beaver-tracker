import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Linking, StyleSheet, Text, View } from "react-native";
import { useWakeWord, WakeWordStatus } from "../../modules/wake-word";

export default function WakeWordScreen() {
  const router = useRouter();
  const pathname = usePathname();

  const [enabled, setEnabled] = useState(true);
  const [heardCount, setHeardCount] = useState(0);
  const [lastHeard, setLastHeard] = useState<string | null>(null);

  const { status, error, start } = useWakeWord({
    enabled: enabled && pathname !== "/voice-test",
    onDetect: (d) => {
      setHeardCount((c) => c + 1);
      setLastHeard(`${d.name} · ${(d.confidence * 100).toFixed(0)}%`);
      console.log("logged hey beaver");
    },
  });

  useEffect(() => {
    if (heardCount === 0) return; // don't navigate on first render
    router.navigate("/voice-test");
  }, [router, heardCount]);

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
        <Text style={styles.status}>{STATUS_LABEL[status]}</Text>
      </View>

      <Text style={styles.count}>{heardCount}</Text>
      <Text style={styles.caption}>times heard</Text>
      {lastHeard && <Text style={styles.last}>Last: {lastHeard}</Text>}

      {error && <Text style={styles.error}>{error}</Text>}

      {status === "denied" && (
        <Button title="Open Settings" onPress={() => Linking.openSettings()} />
      )}
      {status === "error" && <Button title="Try again" onPress={start} />}

      <Button
        title={enabled ? "Turn off wake word" : "Turn on wake word"}
        onPress={() => setEnabled((e) => !e)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  status: { fontSize: 16 },
  count: { fontSize: 64, fontWeight: "600", marginTop: 24 },
  caption: { color: "#888" },
  last: { color: "#555" },
  error: { color: "#D14520", textAlign: "center" },
});

const STATUS_LABEL: Record<WakeWordStatus, string> = {
  idle: "Not listening",
  starting: "Starting…",
  listening: 'Listening for "Hey Beaver"',
  stopping: "Stopping…",
  denied: "Microphone access denied",
  error: "Something went wrong",
  unsupported: "Not supported on this device",
};

const STATUS_COLOR: Record<WakeWordStatus, string> = {
  idle: "#888",
  starting: "#E0A800",
  listening: "#1D9E75",
  stopping: "#E0A800",
  denied: "#D14520",
  error: "#D14520",
  unsupported: "#D14520",
};
