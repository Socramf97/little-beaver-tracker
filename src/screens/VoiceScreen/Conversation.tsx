import { useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { styles } from "./Styles";

import { Message, Phase } from "@/features/voice/hooks/useSpeechToText";

export function Conversation({
  messages,
  transcript,
  phase,
}: {
  messages: Message[];
  transcript: string;
  phase: Phase;
}) {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.conversation}
      contentContainerStyle={styles.conversationContent}
      onContentSizeChange={() =>
        scrollRef.current?.scrollToEnd({ animated: true })
      }
    >
      {messages.map((m) => (
        <Bubble key={m.id} message={m} />
      ))}

      {/* What they're saying right now: dashed until it's final */}
      {transcript !== "" && <LiveBubble text={transcript} />}
      {phase === "thinking" && (
        <Bubble message={{ id: "thinking", from: "app", text: "…" }} />
      )}
    </ScrollView>
  );
}

export function Bubble({ message }: { message: Message }) {
  const isUser = message.from === "user";
  return (
    <View
      style={[styles.bubble, isUser ? styles.userBubble : styles.appBubble]}
    >
      <Text style={isUser ? styles.userText : styles.appText}>
        {message.text}
      </Text>
    </View>
  );
}

export function LiveBubble({ text }: { text: string }) {
  return (
    <View style={[styles.bubble, styles.userBubble, styles.liveBubble]}>
      <Text style={styles.liveText}>{text}</Text>
    </View>
  );
}
