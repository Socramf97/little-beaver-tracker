# Event Service

The event service is how screens and voice save and edit feeding and diaper events. Every draft is validated before it reaches the database, so screens and voice should call these functions instead of calling the database functions directly.

## Functions

### `createEvent(draft)`

Validates the draft and saves it as a new event.

- Returns a saved event, including its new `id`
- Throws `EventValidationError` if something is missing or wrong, or an `Error` if saving fails

### `updateEvent(id, draft)`

Validates the new values and updates an existing event.

- Returns the updated event
- Throws `EventValidationError` if something is missing or wrong, or an `Error` if saving fails or no event has that `id`
- Include the event's original `timestamp` in the draft. If it's missing, validation fills in "now" and the event's time changes.

## What goes in a draft (`EventDraft`)

- Every draft needs a `kind` ("feeding" or "diaper") and a `babyId`. `timestamp` and `notes` are optional, and the timestamp defaults to now.
- Feedings need a `feedingType` ("breast", "bottle", or "formula"). If you add an `amount` it needs a `unit` too ("oz" or "mL"). Diapers need a `diaperType` ("pee", "poop", or "both").
- Values are case-sensitive: `"Formula"` or `"ml"` will be rejected.

## Errors you might see

- Missing or wrong info throws an `EventValidationError` (check `error.errors`).
- Measurements throw "can't be saved yet," database problems throw "Something went wrong...", and updating an `id` that doesn't exist throws "Entry could not be found."

## Good to know

- You don't need to pass an `id` to `createEvent`. The service creates one for you.
- An event's type also can't change when editing. To turn a diaper into a feeding, you'd delete it and create a new one.
- Measurements and deleting events aren't supported yet.

## Examples

### Manual entry screen (saving a feeding)

```ts
async function exampleSave() {
  setSaving(true);
  try {
    const saved = await createEvent({
      kind: "feeding",
      babyId: selectedBaby.id,
      feedingType: "formula",
      amount: Number(amountText), // text inputs give a string, so convert it
      unit: "oz",
    });
    // success: show "Feeding saved!"
  } catch (error) {
    if (error instanceof EventValidationError) {
      // show error.errors[0].message, e.g. "Which baby is this for?"
    } else {
      // show (error as Error).message, e.g. "Something went wrong..."
    }
  } finally {
    setSaving(false); // runs whether it worked or not, so the Save button stops loading
  }
}
```

### Editing an event

```ts
await updateEvent(event.id, {
  kind: "diaper",
  babyId: event.babyId,
  diaperType: "poop", // the changed value
  timestamp: event.timestamp, // keep the original time!
});
```

### Voice

For a working example, see: `src/features/voice/saveVoiceCommand.ts`.

When validation fails, it takes the first problem from `error.errors` and asks the parent that question (for example "Which baby is this for?"). Each problem in `error.errors` has a `field` and a `message`, so other screens can do the same thing or show every problem at once.
