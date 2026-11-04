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
      return {};

    case "unknown":
      return undefined;
  }
}
