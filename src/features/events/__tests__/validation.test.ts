import type { EventDraft } from "../types";
import { EventValidationError, validateEvent } from "../validation";

// Validation doesn't access the DB so no fakes needed.
// Valid drafts return an event, invalid ones throw EventValidationError

const NOW = new Date("2026-11-03T10:00:00Z");

// Runs validation and returns the fields that had problems ([] if valid).
function problemFields(draft: EventDraft): string[] {
  try {
    validateEvent(draft);
    return [];
  } catch (error) {
    if (error instanceof EventValidationError) {
      return error.errors.map((e) => e.field);
    }
    throw error;
  }
}

// ---------- Valid Drafts ----------

describe("valid", () => {
  test.each<{ name: string; draft: EventDraft }>([
    {
      name: "complete feeding",
      draft: {
        kind: "feeding",
        babyId: "b1",
        feedingType: "formula",
        amount: 3,
        unit: "oz",
      },
    },
    {
      name: "feeding in mL",
      draft: {
        kind: "feeding",
        babyId: "b1",
        feedingType: "bottle",
        amount: 120,
        unit: "mL",
      },
    },
    {
      name: "feeding with no amount",
      draft: { kind: "feeding", babyId: "b1", feedingType: "breast" },
    },
    {
      name: "diaper change",
      draft: { kind: "diaper", babyId: "b1", diaperType: "both" },
    },
    {
      name: "measurement with only one value",
      draft: { kind: "measurement", babyId: "b1", weightKg: 4.2 },
    },
  ])("$name -> no problems", ({ draft }) => {
    expect(problemFields(draft)).toEqual([]);
  });
});

// ---------- Invalid Drafts ----------

describe("problems", () => {
  test.each<{ name: string; draft: EventDraft; expected: string[] }>([
    {
      name: "missing baby",
      draft: { kind: "diaper", diaperType: "pee" },
      expected: ["babyId"],
    },
    {
      name: "unknown kind",
      draft: { kind: "bath", babyId: "b1" },
      expected: ["kind"],
    },
    {
      name: "misheard feeding type",
      draft: { kind: "feeding", babyId: "b1", feedingType: "formular" },
      expected: ["feedingType"],
    },
    {
      name: "amount without a unit",
      draft: {
        kind: "feeding",
        babyId: "b1",
        feedingType: "bottle",
        amount: 4,
      },
      expected: ["unit"],
    },
    {
      name: "lowercase ml (only mL is allowed)",
      draft: {
        kind: "feeding",
        babyId: "b1",
        feedingType: "bottle",
        amount: 120,
        unit: "ml",
      },
      expected: ["unit"],
    },
    {
      name: "zero amount",
      draft: {
        kind: "feeding",
        babyId: "b1",
        feedingType: "bottle",
        amount: 0,
        unit: "oz",
      },
      expected: ["amount"],
    },
    {
      name: "diaper without a type",
      draft: { kind: "diaper", babyId: "b1" },
      expected: ["diaperType"],
    },
    {
      name: "measurement with no values",
      draft: { kind: "measurement", babyId: "b1" },
      expected: ["measurement"],
    },
    {
      name: "negative weight",
      draft: { kind: "measurement", babyId: "b1", weightKg: -3 },
      expected: ["weightKg"],
    },
    {
      name: "several problems at once",
      draft: { kind: "feeding" },
      expected: ["babyId", "feedingType"],
    },
  ])("$name -> $expected", ({ draft, expected }) => {
    expect(problemFields(draft)).toEqual(expected);
  });

  test("the error message lists every question", () => {
    expect(() => validateEvent({ kind: "feeding" })).toThrow(
      "Which baby is this for? What kind of feeding was it: breast, bottle, or formula?",
    );
  });
});

// ----------  Defaults filled in by validation(if possible) ----------

describe("defaults", () => {
  test("uses the current time when no timestamp is given", () => {
    const event = validateEvent({
      kind: "diaper",
      babyId: "b1",
      diaperType: "pee",
    });
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  test("keeps the timestamp when one is given", () => {
    const event = validateEvent({
      kind: "diaper",
      babyId: "b1",
      diaperType: "pee",
      timestamp: NOW,
    });
    expect(event.timestamp).toEqual(NOW);
  });

  test("isApproximate defaults to false", () => {
    const event = validateEvent({
      kind: "feeding",
      babyId: "b1",
      feedingType: "breast",
    });
    expect(event).toMatchObject({ isApproximate: false });
  });

  test("drops the unit when there's no amount", () => {
    const event = validateEvent({
      kind: "feeding",
      babyId: "b1",
      feedingType: "breast",
      unit: "oz",
    });
    expect(event).toMatchObject({ unit: undefined });
  });
});
