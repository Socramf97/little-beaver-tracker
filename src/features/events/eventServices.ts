// Event Services where screens and voice can save, edit, or delete events
// Event drafts are validated before being sent to the DB

import * as Crypto from "expo-crypto";
import {
    createDiaperEvent,
    deleteDiaperEvent,
    updateDiaperEvent,
} from "../../../services/database/diapers";
import {
    createFeedingEvent,
    deleteFeedingEvent,
    updateFeedingEvent,
} from "../../../services/database/feedings";
import type { BabyEvent, EventDraft, EventKind } from "./types";
import { validateEvent } from "./validation";

// Used to create an ID when creating a new event (ID not created in DB)
function makeId(): string {
  return Crypto.randomUUID();
}

// Validates draft of a new event and saves it as a new event.
// Throws an EventValidationError if the draft has problems, or an Error if saving fails.
export async function createEvent(draft: EventDraft): Promise<BabyEvent> {
  // Stops if the draft has problems, error message gets sent back to the user to fix
  const event = validateEvent(draft);

  // Measurements don't have database functions yet, will be implemented in the future
  if (event.kind !== "diaper" && event.kind !== "feeding") {
    throw new Error("This type of event can't be saved yet.");
  }

  const id = makeId();

  try {
    if (event.kind === "diaper") {
      await createDiaperEvent({
        id,
        baby_id: event.babyId,
        diaper_type: event.diaperType,
        notes: event.notes,
        timestamp: event.timestamp.toISOString(),
      });
    } else {
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
    }
  } catch (error) {
    // Logs DB problems
    console.error("Failed to save event:", error);
    throw new Error("Something went wrong, entry not saved. Please try again.");
  }

  // Sends back saved event with created ID
  return { ...event, id };
}

// Edits existing event, draft should include original timestamp,
// otherwise timestamp will be updated to current time.
// Throws an EventValidationError if the draft has problems or if the DB fails.
export async function updateEvent(
  id: string,
  draft: EventDraft,
): Promise<BabyEvent> {
  const event = validateEvent(draft);

  // Measurements don't have database functions yet
  if (event.kind !== "diaper" && event.kind !== "feeding") {
    throw new Error("This type of event can't be edited yet.");
  }

  // Starts as false, waits for DB response. Checked after try to keep our "not found" error.
  let updated = false;

  try {
    if (event.kind === "diaper") {
      updated = await updateDiaperEvent({
        id,
        baby_id: event.babyId,
        diaper_type: event.diaperType,
        notes: event.notes,
        timestamp: event.timestamp.toISOString(),
      });
    } else {
      updated = await updateFeedingEvent({
        id,
        baby_id: event.babyId,
        feeding_type: event.feedingType,
        amount: event.amount,
        unit: event.unit,
        is_approximate: event.isApproximate,
        notes: event.notes,
        timestamp: event.timestamp.toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to update event:", error);
    throw new Error("Something went wrong, entry not saved. Please try again.");
  }

  // false means no event has this id (for example, it was already deleted)
  if (!updated) {
    throw new Error("Entry could not be found. It may have been deleted.");
  }

  return { ...event, id };
}

// Deletes an existing event. Needs the kind because feedings and diapers
// are saved in different tables.
// Throws an Error if the DB fails or no event has that id.
export async function deleteEvent(kind: EventKind, id: string): Promise<void> {
  // Measurements don't have database functions yet
  if (kind !== "diaper" && kind !== "feeding") {
    throw new Error("This type of event can't be deleted yet.");
  }

  // Starts as false, waits for DB response. Checked after try to keep our "not found" error.
  let deleted = false;

  try {
    if (kind === "diaper") {
      deleted = await deleteDiaperEvent(id);
    } else {
      deleted = await deleteFeedingEvent(id);
    }
  } catch (error) {
    console.error("Failed to delete event:", error);
    throw new Error("Something went wrong, entry not deleted. Please try again.");
  }

  // false means no event has this id (for example, it was already deleted)
  if (!deleted) {
    throw new Error("Entry could not be found. It may have already been deleted.");
  }
}
