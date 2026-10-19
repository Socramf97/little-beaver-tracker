import type {
    DiaperType,
    EventDraft,
    EventKind,
    FeedingType,
    NewBabyEvent,
    VolumeUnit,
} from "./types";

// Allowed values so we can check them while the app runs
const EVENT_KINDS: EventKind[] = ["feeding", "diaper", "measurement"];
const FEEDING_TYPES: FeedingType[] = ["breast", "bottle", "formula"];
const VOLUME_UNITS: VolumeUnit[] = ["oz", "mL"];
const DIAPER_TYPES: DiaperType[] = ["pee", "poop", "both"];

export type ValidationError = {
  field: string;
  message: string;
};

// Validation returns a valid event or a list of problems
export type ValidationResult =
  | { ok: true; event: NewBabyEvent }
  | { ok: false; errors: ValidationError[] };

// Checks that a number is above zero
function isPositive(value: number): boolean {
  return value > 0;
}

// Checks if a value is one of the allowed choices in a list
function isValidChoice<T extends string>(
  list: T[],
  value: string | undefined,
): value is T {
  // A missing value isn't a valid choice
  if (value === undefined) {
    return false;
  }

  // Goes through each allowed choice and check for a match
  for (const choice of list) {
    if (choice === value) {
      return true;
    }
  }

  // No match found
  return false;
}

// Checks the fields every event needs. Adds any problems to the errors list
function checkCommonFields(draft: EventDraft, errors: ValidationError[]): void {
  // Must be a feeding, diaper, or measurement
  if (!isValidChoice(EVENT_KINDS, draft.kind)) {
    errors.push({
      field: "kind",
      message: "Was this a feeding, a diaper change, or a measurement?",
    });
  }

  // Every event needs a baby
  if (!draft.babyId) {
    errors.push({ field: "babyId", message: "Which baby is this for?" });
  }
}

// Checks the fields for feedings
function checkFeeding(draft: EventDraft, errors: ValidationError[]): void {
  if (!isValidChoice(FEEDING_TYPES, draft.feedingType)) {
    errors.push({
      field: "feedingType",
      message: "What kind of feeding was it: breast, bottle, or formula?",
    });
  }

  // Amount is optional but if it's given it needs to be valid
  if (draft.amount !== undefined) {
    if (!isPositive(draft.amount)) {
      errors.push({
        field: "amount",
        message: "The amount should be more than zero.",
      });
    }
    if (!isValidChoice(VOLUME_UNITS, draft.unit)) {
      errors.push({
        field: "unit",
        message: "Was that in ounces or milliliters?",
      });
    }
  }
}

// Checks the fields a diaper change needs.
function checkDiaper(draft: EventDraft, errors: ValidationError[]): void {
  if (!isValidChoice(DIAPER_TYPES, draft.diaperType)) {
    errors.push({ field: "diaperType", message: "Was it pee, poop, or both?" });
  }
}

// Checks the fields a measurement needs.
function checkMeasurement(draft: EventDraft, errors: ValidationError[]): void {
  // Needs at least one measurement
  if (
    draft.weightKg === undefined &&
    draft.lengthCm === undefined &&
    draft.headCircumferenceCm === undefined
  ) {
    errors.push({
      field: "measurement",
      message: "What did you measure: weight, length, or head size?",
    });
  }

  // Measurement values need to be more than zero
  if (draft.weightKg !== undefined && !isPositive(draft.weightKg)) {
    errors.push({
      field: "weightKg",
      message: "The weight should be more than zero.",
    });
  }
  if (draft.lengthCm !== undefined && !isPositive(draft.lengthCm)) {
    errors.push({
      field: "lengthCm",
      message: "The length should be more than zero.",
    });
  }
  if (
    draft.headCircumferenceCm !== undefined &&
    !isPositive(draft.headCircumferenceCm)
  ) {
    errors.push({
      field: "headCircumferenceCm",
      message: "The head size should be more than zero.",
    });
  }
}

// Turns a draft that passed every check into a new baby event.
// Only call this after validation finds no problems.
function buildEvent(draft: EventDraft): NewBabyEvent {
  const babyId = draft.babyId as string;
  const timestamp = draft.timestamp ?? new Date();

  if (draft.kind === "feeding") {
    return {
      kind: "feeding",
      babyId,
      timestamp,
      notes: draft.notes,
      feedingType: draft.feedingType as FeedingType,
      amount: draft.amount,
      // Only keeps the unit if there's an amount to go with it
      unit: draft.amount !== undefined ? (draft.unit as VolumeUnit) : undefined,
      isApproximate: draft.isApproximate ?? false,
    };
  }

  if (draft.kind === "diaper") {
    return {
      kind: "diaper",
      babyId,
      timestamp,
      notes: draft.notes,
      diaperType: draft.diaperType as DiaperType,
    };
  }

  return {
    kind: "measurement",
    babyId,
    timestamp,
    notes: draft.notes,
    weightKg: draft.weightKg,
    lengthCm: draft.lengthCm,
    headCircumferenceCm: draft.headCircumferenceCm,
  };
}

// Checks a draft from voice or a form.
// Returns a valid event ready to save, or a list of problems to ask the parent about.
export function validateEvent(draft: EventDraft): ValidationResult {
  const errors: ValidationError[] = [];

  checkCommonFields(draft, errors);

  if (draft.kind === "feeding") {
    checkFeeding(draft, errors);
  } else if (draft.kind === "diaper") {
    checkDiaper(draft, errors);
  } else if (draft.kind === "measurement") {
    checkMeasurement(draft, errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, event: buildEvent(draft) };
}
