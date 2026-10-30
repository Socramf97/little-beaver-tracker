// Event Services where screens and voice can save or edit events
// Event drafts are validaded before being sent to the DB

import {
    createDiaperEvent,
    updateDiaperEvent,
} from "../../../services/database/diapers";
import {
    createFeedingEvent,
    updateFeedingEvent,
} from "../../../services/database/feedings";
import { EventDraft } from "./types";
import { validateEvent } from "./validation";

// Used to create an ID when creating a new event (ID not created in DB)
function makeId(): string {
  const time = Date.now(); // ID created using current date and time
  const randomInt = Math.floor(Math.random() * 1000); // adds a random int in case of duplicate timestamp
  return `${time}${randomInt}`;
}

// Validates draft of a new event and saves it as a new event

export async function createEvent(draft: EventDraft) {
  const result = validateEvent(draft);
  if (!result.ok) {
    return result; // Stops draft if there are errors, errors get sent back to the user to fix
  }
  const id = makeId();
  const event = result.event;

  if (event.kind === "diaper") {
    await createDiaperEvent({
      id,
      baby_id: event.babyId,
      diaper_type: event.diaperType,
      notes: event.notes,
      timestamp: event.timestamp.toISOString(),
    });
    // sends back saved event with created ID
    return { ok: true, event: { ...event, id } };
  }
  if (event.kind === "feeding") {
    await createFeedingEvent({
      id,
      baby_id: event.babyId,
      feeding_type: event.feedingType,
      amount: event.amount,
      unit: event.unit,
      is_approximate: event.isApproximate,
      notes: event.notes,
      timestamp: event.timestamp.toISOString(),
    });
    return { ok: true, event: { ...event, id } };
  }
}

// Edits existing event, draft should include original timestamp,
// otherwise timestamp will be updated to current time.

export async function updateEvent(id: string, draft: EventDraft) {
  const result = validateEvent(draft);
  if (!result.ok) {
    return result;
  }

  const event = result.event;

  if (event.kind === "diaper") {
    const updated = await updateDiaperEvent({
      id,
      baby_id: event.babyId,
      diaper_type: event.diaperType,
      notes: event.notes,
      timestamp: event.timestamp.toISOString(),
    });
    if (!updated) {
      return {
        ok: false,
        errors: [
          {
            field: "id",
            message: "Entry could not be found. It may have been deleted",
          },
        ],
      };
    }
    return { ok: true, event: { ...event, id } };
  }
  if (event.kind === "feeding") {
    const updated = await updateFeedingEvent({
      id,
      baby_id: event.babyId,
      feeding_type: event.feedingType,
      amount: event.amount,
      unit: event.unit,
      is_approximate: event.isApproximate,
      notes: event.notes,
      timestamp: event.timestamp.toISOString(),
    });
    if (!updated) {
      return {
        ok: false,
        errors: [
          {
            field: "id",
            message: "Entry could not be found. It may have been deleted",
          },
        ],
      };
    }
    return { ok: true, event: { ...event, id } };
  }
}
