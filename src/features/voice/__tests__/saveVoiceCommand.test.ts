import { createEvent } from "../../events/eventService";
import { confirmationText, saveVoiceCommand } from "../saveVoiceCommand";
import type { BabyRef } from "../types";

// Replace Marcos's createEvent with a fake we control.
// The parser and toEventDraft are still real; only saving is faked.
jest.mock("../../events/eventService", () => ({
  createEvent: jest.fn(),
}));
const mockCreateEvent = createEvent as jest.Mock;

const EMMA: BabyRef = { id: "b1", name: "Emma" };
const LIAM: BabyRef = { id: "b2", name: "Liam" };
const BABIES = [EMMA, LIAM];
const NOW = new Date("2026-11-03T10:00:00Z");

/** Makes the fake createEvent "save" whatever draft it gets and give it an id. */
function fakeSaveSucceeds() {
  mockCreateEvent.mockImplementation(async (draft) => ({
    ok: true,
    event: { ...draft, id: "e1", timestamp: NOW },
  }));
}

beforeEach(() => {
  mockCreateEvent.mockReset(); // clear calls and behavior between tests
});

// ---------- saveVoiceCommand: one test group per status ----------

describe("saved", () => {
  beforeEach(fakeSaveSucceeds);

  test("sends the right draft to createEvent", async () => {
    await saveVoiceCommand(
      "Emma just had about three ounces of formula",
      BABIES,
    );

    expect(mockCreateEvent).toHaveBeenCalledTimes(1);
    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "feeding",
        babyId: "b1",
        feedingType: "formula",
        amount: 3,
        unit: "oz",
        isApproximate: true,
      }),
    );
  });

  test("returns the saved event (with its id, for Undo) and a message", async () => {
    const result = await saveVoiceCommand("Liam had a wet diaper", BABIES);

    expect(result).toEqual({
      status: "saved",
      event: expect.objectContaining({
        id: "e1",
        babyId: "b2",
        diaperType: "pee",
      }),
      message: "Logged a wet diaper for Liam",
    });
  });

  test("uses 'the baby' if the saved babyId isn't in the list", async () => {
    mockCreateEvent.mockResolvedValue({
      ok: true,
      event: {
        kind: "diaper",
        diaperType: "pee",
        babyId: "someone-else",
        id: "e1",
        timestamp: NOW,
      },
    });
    const result = await saveVoiceCommand("Liam had a wet diaper", BABIES);
    expect(result).toMatchObject({
      message: "Logged a wet diaper for the baby",
    });
  });
});

describe("needsInfo", () => {
  test("returns the first validation question", async () => {
    mockCreateEvent.mockResolvedValue({
      ok: false,
      errors: [
        { field: "babyId", message: "Which baby is this for?" },
        { field: "feedingType", message: "What kind of feeding was it?" },
      ],
    });

    const result = await saveVoiceCommand("had three ounces", BABIES);
    expect(result).toEqual({
      status: "needsInfo",
      field: "babyId",
      question: "Which baby is this for?",
    });
  });
});

describe("notUnderstood", () => {
  test.each(["What's the weather today", ""])(
    "%j -> notUnderstood, nothing saved",
    async (say) => {
      const result = await saveVoiceCommand(say, BABIES);
      expect(result).toEqual({ status: "notUnderstood" });
      expect(mockCreateEvent).not.toHaveBeenCalled(); // never tried to save
    },
  );
});

describe("notSupported", () => {
  test("createEvent returns nothing (measurement isn't supported yet)", async () => {
    mockCreateEvent.mockResolvedValue(undefined);
    const result = await saveVoiceCommand(
      "Emma weighs nine pounds four ounces",
      BABIES,
    );
    expect(result).toEqual({ status: "notSupported", kind: "measurement" });
  });
});

test("if saving throws (database error), the error is passed up", async () => {
  mockCreateEvent.mockRejectedValue(new Error("database is locked"));
  await expect(
    saveVoiceCommand("Liam had a wet diaper", BABIES),
  ).rejects.toThrow("database is locked");
});

// ---------- confirmationText ----------

describe("confirmationText", () => {
  const base = { id: "e1", babyId: "b1", timestamp: NOW };

  describe("feeding", () => {
    test.each([
      // [feedingType, amount, unit, isApproximate, expected]
      ["formula", 3, "oz", false, "Logged 3 ounces of formula for Emma"],
      ["formula", 3, "oz", true, "Logged about 3 ounces of formula for Emma"],
      ["formula", 1, "oz", false, "Logged 1 ounce of formula for Emma"], // singular
      ["formula", 2.5, "oz", false, "Logged 2.5 ounces of formula for Emma"], // decimal kept
      ["formula", 3.333, "oz", false, "Logged 3.3 ounces of formula for Emma"], // rounded
      [
        "bottle",
        120,
        "mL",
        false,
        "Logged 120 milliliters from a bottle for Emma",
      ],
      ["bottle", 1, "mL", false, "Logged 1 milliliter from a bottle for Emma"], // singular
    ] as const)(
      "%s %s %s approx=%s",
      (feedingType, amount, unit, isApproximate, expected) => {
        const event = {
          ...base,
          kind: "feeding",
          feedingType,
          amount,
          unit,
          isApproximate,
        } as const;
        expect(confirmationText(event, "Emma")).toBe(expected);
      },
    );

    test.each([
      ["breast", "Logged a nursing session for Emma"],
      ["formula", "Logged formula for Emma"], // no amount
      ["bottle", "Logged a bottle for Emma"], // no amount
    ] as const)("%s with no amount", (feedingType, expected) => {
      const event = {
        ...base,
        kind: "feeding",
        feedingType,
        isApproximate: false,
      } as const;
      expect(confirmationText(event, "Emma")).toBe(expected);
    });
  });

  describe("diaper", () => {
    test.each([
      ["pee", "Logged a wet diaper for Emma"],
      ["poop", "Logged a dirty diaper for Emma"],
      ["both", "Logged a wet and dirty diaper for Emma"],
    ] as const)("%s", (diaperType, expected) => {
      const event = { ...base, kind: "diaper", diaperType } as const;
      expect(confirmationText(event, "Emma")).toBe(expected);
    });
  });

  test("measurement", () => {
    const event = { ...base, kind: "measurement", weightKg: 4.2 } as const;
    expect(confirmationText(event, "Emma")).toBe(
      "Logged a measurement for Emma",
    );
  });

  test("no double spaces anywhere", () => {
    const event = {
      ...base,
      kind: "feeding",
      feedingType: "formula",
      amount: 3,
      unit: "oz",
      isApproximate: false,
    } as const;
    expect(confirmationText(event, "Emma")).not.toMatch(/ {2}/);
  });
});
