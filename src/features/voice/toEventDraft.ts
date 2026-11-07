import { toCm, toKg } from "@/utils/units";
import { EventDraft } from "../events/types";
import { ParsedCommand } from "./types";

// Turns what the voice parser took and turn it into an event using EventService

/** Main Function entry */
export function toEventDraft(command: ParsedCommand): EventDraft | undefined {
  switch (command.kind) {
    case "feeding":
      return {
        kind: "feeding",
        babyId: command.baby?.id,
        feedingType: command.feedType,
        amount: command.amount,
        unit: command.unit,
        isApproximate: command.approximate,
      };

    case "diaper":
      return {
        kind: "diaper",
        babyId: command.baby?.id,
        diaperType: command.diaperType,
      };

    case "measurement":
      const draft: EventDraft = {
        kind: "measurement",
        babyId: command.baby?.id,
      };

      if (command.value === undefined || command.unit === undefined) {
        return draft;
      }

      if (command.metric === "weight") {
        draft.weightKg = toKg(command.value, command.unit);
      } else if (command.metric === "length") {
        draft.lengthCm = toCm(command.value, command.unit);
      } else {
        draft.headCircumferenceCm = toCm(command.value, command.unit);
      }
      return draft;

    case "unknown":
      return undefined;
  }
}
