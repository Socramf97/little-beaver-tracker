import { formatLength, formatWeight } from "@/utils/units";
import { createEvent } from "../events/eventServices";
import { BabyEvent } from "../events/types";
import { parseCommands } from "./parser/parseCommand";
import { toEventDraft } from "./toEventDraft";
import { BabyRef } from "./types";

export type VoiceSaveResult =
  | { status: "saved"; event: BabyEvent; message: string }
  | { status: "needsInfo"; question: string; field: string }
  | { status: "notUnderstood" }
  | { status: "notSupported"; kind: string };

// Take the full parsed command and save it to marco's event service OR require more information
export async function saveVoiceCommand(
  transcript: string,
  babies: BabyRef[],
): Promise<VoiceSaveResult> {
  const parsed = parseCommands(transcript, babies);
  const draft = toEventDraft(parsed.command);

  if (!draft) {
    return { status: "notUnderstood" };
  }

  const result = await createEvent(draft);

  if (!result) {
    return { status: "notSupported", kind: draft.kind ?? "unknown" };
  }
  if ("errors" in result) {
    const first = result.errors[0];
    return { status: "needsInfo", question: first.message, field: first.field };
  }

  const babyName =
    babies.find((b) => b.id === result.event.babyId)?.name ?? "the baby";
  return {
    status: "saved",
    event: result.event,
    message: confirmationText(result.event, babyName),
  };
}

// Confirmation Text: What is returned after saving event

export function confirmationText(event: BabyEvent, babyName: string): string {
  if (event.kind === "feeding") {
    if (event.feedingType === "breast") {
      return `Logged a nursing session for ${babyName}`;
    }

    const type = event.feedingType;

    if (event.amount === undefined) {
      return `Logged a ${type} for ${babyName}`;
    }

    const estimate = event.isApproximate ? "about" : "";
    const amount = `${estimate} ${event.amount.toFixed(1)} ${unitWord(event.amount, event.unit)}`;
    return `Logged ${amount} of ${type} for ${babyName}`;
  }

  if (event.kind === "diaper") {
    let type = "wet and dirty";

    if (event.diaperType === "pee") {
      type = "wet";
    } else if (event.diaperType === "poop") {
      type = "dirty";
    }

    return `Logged a ${type} diaper for ${babyName}`;
  }

  if (event.kind === "measurement") {
    if (event.weightKg !== undefined) {
      return `Logged a weight of ${formatWeight(event.weightKg)} for ${babyName}`;
    }

    if (event.lengthCm !== undefined) {
      return `Logged a length of ${formatLength(event.lengthCm)} for ${babyName}`;
    }
    if (event.headCircumferenceCm !== undefined) {
      return `Logged a head size of ${formatLength(event.headCircumferenceCm)} for ${babyName}`;
    }

    return `Logged a measurement for ${babyName}`;
  }

  return `Saved an event for ${babyName}`;
}

// HELPERS

// "1 ounce", "3 ounces", "120 milliliters"

function unitWord(amount: number, unit: string | undefined): string {
  if (unit === "mL") {
    if (amount === 1) {
      return "milliliter";
    } else {
      return "milliliters";
    }
  } else {
    return amount === 1 ? "ounce" : "ounces";
  }
}
