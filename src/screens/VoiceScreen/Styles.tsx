// ---------- Styles ----------

import { StyleSheet } from "react-native";

const GREEN = "#2a6";

export const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },

  header: { height: 44, justifyContent: "center", alignItems: "center" },
  grabber: { width: 36, height: 5, borderRadius: 3, backgroundColor: "#ddd" },
  closeButton: { position: "absolute", right: 0 },
  close: { fontSize: 22, color: "#666" },

  // Empty state
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  title: { fontSize: 24, fontWeight: "600", color: "#111", marginTop: 16 },
  subtitle: { fontSize: 17, color: "#555" },
  examples: { marginTop: 28, alignItems: "center", gap: 6 },
  examplesLabel: {
    fontSize: 13,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  example: { fontSize: 16, color: "#777" },

  // Conversation
  conversation: { flex: 1 },
  conversationContent: { gap: 8, paddingVertical: 12 },
  bubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  userBubble: { alignSelf: "flex-end", backgroundColor: GREEN },
  appBubble: { alignSelf: "flex-start", backgroundColor: "#f0f0f0" },
  userText: { color: "#fff", fontSize: 17 },
  appText: { color: "#111", fontSize: 17 },
  liveBubble: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: GREEN,
  },
  liveText: { color: GREEN, fontSize: 17 },

  footer: { alignItems: "center", paddingVertical: 16 },

  // Mic
  ring: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eee",
  },
  ringOn: { backgroundColor: "#cdebd9" },
  mic: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#999",
  },
  micOn: { backgroundColor: GREEN },

  error: { textAlign: "center", color: "#c33", paddingBottom: 12 },

  status: {
    fontSize: 15,
    color: "#666",
    minHeight: 20,
    marginBottom: 8,
  },

  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2a6",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  manualButtonPressed: {
    backgroundColor: "#e8f5ee",
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2a6",
  },
});
