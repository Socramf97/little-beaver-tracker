import { saveVoiceCommand, VoiceSaveResult } from "../saveVoiceCommand";
import { BabyRef } from "../types";

export async function handleCommand(
  text: string,
  babies: BabyRef[],
  activeBabyId?: string,
): Promise<{ result: VoiceSaveResult; text: string }> {
  const result = await saveVoiceCommand(text, babies, activeBabyId);
  switch (result.status) {
    case "saved":
      return { result, text: result.message };
    case "needsInfo":
      return { result, text: result.question };
    case "notUnderstood":
      return { result, text: "Sorry, I didn't catch that." };
    case "notSupported":
      return { result, text: "Measurements aren't supported yet." };
    case "failed":
      return { result, text: "Couldn't save that. Please try again." };
  }
}
