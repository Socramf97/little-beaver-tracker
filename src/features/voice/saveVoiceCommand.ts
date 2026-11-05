import { formatLength, formatWeight } from "@/utils/units";
import { createEvent } from "../events/eventServices";
import { BabyEvent } from "../events/types";
import { EventValidationError } from "../events/validation";
import { parseCommands } from "./parser/parseCommand";
import { toEventDraft } from "./toEventDraft";
import { BabyRef } from "./types";

export type VoiceSaveResult =
  | { status: "saved"; event: BabyEvent; message: string }
  | { status: "needsInfo"; question: string; field: string }
  | { status: "notUnderstood" }
  | { status: "notSupported"; kind: string }
  | { status: "failed"; message: string };

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

  // Measurements can't be saved yet, so catch it before calling the service
  if (draft.kind === "measurement") {
    return { status: "notSupported", kind: draft.kind };
  }

  try {
    const event = await createEvent(draft);

    const babyName =
      babies.find((b) => b.id === event.babyId)?.name ?? "the baby";
    return {
      status: "saved",
      event,
      message: confirmationText(event, babyName),
    };
  } catch (error) {
    if (error instanceof EventValidationError) {
      const first = error.errors[0];
      return {
        status: "needsInfo",
        question: first.message,
        field: first.field,
      };
    }
    // DB failure or anything else
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

// Confirmation Text: What is returned after saving event

export function confirmationText(event: BabyEvent, babyName: string): string {
  if (event.kind === "feeding") {
    if (event.feedingType === "breast") {
      return `Logged a nursing session for ${babyName}`;
    }

    const type = event.feedingType;

    if (event.amount === undefined) {
      return type === "bottle"
        ? `Logged a bottle for ${babyName}`
        : `Logged formula for ${babyName}`;
    }

    const estimate = event.isApproximate ? "about " : "";
    const rounded = Number(event.amount.toFixed(1));
    const source = type === "bottle" ? "from a bottle" : "of formula";

    return `Logged ${estimate}${rounded} ${unitWord(rounded, event.unit)} ${source} for ${babyName}`;
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
