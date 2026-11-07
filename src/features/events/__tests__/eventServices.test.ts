import {
    createDiaperEvent,
    updateDiaperEvent,
} from "../../../../services/database/diapers";
import {
    createFeedingEvent,
    updateFeedingEvent,
} from "../../../../services/database/feedings";
import { createEvent, updateEvent } from "../eventServices";
import type { EventDraft } from "../types";
import { EventValidationError } from "../validation";

// Uses fake DB functions and a fake ID so tests don't touch the real database.
// Validation is still real
jest.mock("../../../../services/database/diapers", () => ({
  createDiaperEvent: jest.fn(),
  updateDiaperEvent: jest.fn(),
}));
jest.mock("../../../../services/database/feedings", () => ({
  createFeedingEvent: jest.fn(),
  updateFeedingEvent: jest.fn(),
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "new-id" }));

const mockCreateDiaper = createDiaperEvent as jest.Mock;
const mockUpdateDiaper = updateDiaperEvent as jest.Mock;
const mockCreateFeeding = createFeedingEvent as jest.Mock;
const mockUpdateFeeding = updateFeedingEvent as jest.Mock;

const NOW = new Date("2026-11-03T10:00:00Z");

const DIAPER: EventDraft = {
  kind: "diaper",
  babyId: "b1",
  diaperType: "pee",
  timestamp: NOW,
};

const FEEDING: EventDraft = {
  kind: "feeding",
  babyId: "b1",
  feedingType: "formula",
  amount: 3,
  unit: "oz",
  isApproximate: true,
  timestamp: NOW,
};

// Drafts that should never reach the database
const INVALID_DRAFTS: { name: string; draft: EventDraft }[] = [
  { name: "missing baby", draft: { kind: "diaper", diaperType: "pee" } },
  {
    name: "misheard feeding type",
    draft: { kind: "feeding", babyId: "b1", feedingType: "formular" },
  },
  { name: "unknown kind", draft: { kind: "bath", babyId: "b1" } },
];

beforeEach(() => {
  // clear calls and behavior between tests
  mockCreateDiaper.mockReset();
  mockUpdateDiaper.mockReset();
  mockCreateFeeding.mockReset();
  mockUpdateFeeding.mockReset();
});

// ---------- createEvent tests ----------

describe("createEvent: saved", () => {
  test("converts a diaper draft to the database's names", async () => {
    await createEvent(DIAPER);

    expect(mockCreateDiaper).toHaveBeenCalledTimes(1);
    expect(mockCreateDiaper).toHaveBeenCalledWith({
      id: "new-id",
      baby_id: "b1",
      diaper_type: "pee",
      notes: undefined,
      timestamp: "2026-11-03T10:00:00.000Z",
    });
  });

  test("converts a feeding draft to the database's names", async () => {
    await createEvent(FEEDING);

    expect(mockCreateFeeding).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "new-id",
        baby_id: "b1",
        feeding_type: "formula",
        amount: 3,
        unit: "oz",
        is_approximate: true,
      }),
    );
  });

  test("returns the saved event with new id", async () => {
    const saved = await createEvent(DIAPER);

    expect(saved).toEqual(
      expect.objectContaining({
        id: "new-id",
        kind: "diaper",
        babyId: "b1",
        diaperType: "pee",
      }),
    );
  });
});

describe("createEvent: invalid draft", () => {
  test.each(INVALID_DRAFTS)(
    "$name -> throws, nothing saved",
    async ({ draft }) => {
      await expect(createEvent(draft)).rejects.toThrow(EventValidationError);
      expect(mockCreateDiaper).not.toHaveBeenCalled();
      expect(mockCreateFeeding).not.toHaveBeenCalled();
    },
  );
});

describe("createEvent: notSupported", () => {
  test("measurements throw, nothing saved", async () => {
    await expect(
      createEvent({ kind: "measurement", babyId: "b1", weightKg: 4 }),
    ).rejects.toThrow("can't be saved yet");
    expect(mockCreateDiaper).not.toHaveBeenCalled();
    expect(mockCreateFeeding).not.toHaveBeenCalled();
  });
});

describe("createEvent: failed", () => {
  test("database error -> friendly message", async () => {
    const hideLog = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCreateDiaper.mockRejectedValue(new Error("database is locked"));

    await expect(createEvent(DIAPER)).rejects.toThrow("Something went wrong");

    hideLog.mockRestore();
  });
});

// ---------- updateEvent tests ----------

describe("updateEvent: updated", () => {
  test("updates a diaper using the id passed in", async () => {
    mockUpdateDiaper.mockResolvedValue(true);

    const updated = await updateEvent("e1", DIAPER);

    expect(mockUpdateDiaper).toHaveBeenCalledWith(
      expect.objectContaining({ id: "e1", baby_id: "b1", diaper_type: "pee" }),
    );
    expect(updated.id).toBe("e1");
  });

  test("updates a feeding using the id passed in", async () => {
    mockUpdateFeeding.mockResolvedValue(true);

    await updateEvent("e2", FEEDING);

    expect(mockUpdateFeeding).toHaveBeenCalledWith(
      expect.objectContaining({ id: "e2", feeding_type: "formula", amount: 3 }),
    );
  });
});

describe("updateEvent: not found", () => {
  test("no event with that id -> throws", async () => {
    mockUpdateDiaper.mockResolvedValue(false);

    await expect(updateEvent("missing", DIAPER)).rejects.toThrow(
      "could not be found",
    );
  });
});

describe("updateEvent: invalid draft", () => {
  test.each(INVALID_DRAFTS)(
    "$name -> throws, nothing saved",
    async ({ draft }) => {
      await expect(updateEvent("e1", draft)).rejects.toThrow(
        EventValidationError,
      );
      expect(mockUpdateDiaper).not.toHaveBeenCalled();
      expect(mockUpdateFeeding).not.toHaveBeenCalled();
    },
  );
});

describe("updateEvent: failed", () => {
  test("database error -> friendly message", async () => {
    const hideLog = jest.spyOn(console, "error").mockImplementation(() => {});
    mockUpdateDiaper.mockRejectedValue(new Error("disk full"));

    await expect(updateEvent("e1", DIAPER)).rejects.toThrow(
      "Something went wrong",
    );

    hideLog.mockRestore();
  });
});
