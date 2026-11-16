
import { getDatabase } from "./database";
import {
    createDiaperEvent,
    deleteDiaperEvent,
    getDiaperEventsByBaby,
    updateDiaperEvent,
} from "./diapers";

jest.mock("./database", () => ({
  getDatabase: jest.fn(),
}));

const mockGetDatabase = getDatabase as jest.Mock;
const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  mockGetDatabase.mockResolvedValue({
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
  });

  mockRunAsync.mockResolvedValue({ changes: 1 });
  mockGetAllAsync.mockResolvedValue([]);
});

describe("Diaper event database operations", () => {
  const diaper = {
    id: "diaper-123",
    baby_id: "baby-123",
    diaper_type: "pee",
    notes: "Morning change",
    timestamp: "2026-11-13T08:00:00.000Z",
  };

  test("creates a diaper event linked to the correct baby", async () => {
    await createDiaperEvent(diaper);

    const [sql, params] = mockRunAsync.mock.calls[0];

    expect(sql).toContain("INSERT INTO diaper_events");
    expect(params).toEqual([
      "diaper-123",
      "baby-123",
      "pee",
      "Morning change",
      "2026-11-13T08:00:00.000Z",
    ]);
  });

  test("uses defaults for optional diaper fields", async () => {
    await createDiaperEvent({
      id: "diaper-456",
      baby_id: "baby-123",
      diaper_type: "poop",
    });

    const params = mockRunAsync.mock.calls[0][1];

    expect(params[3]).toBeNull();
    expect(Number.isNaN(Date.parse(params[4]))).toBe(false);
  });

  test("retrieves only the selected baby's diaper events", async () => {
    mockGetAllAsync.mockResolvedValue([diaper]);

    const result = await getDiaperEventsByBaby("baby-123");

    expect(result).toEqual([diaper]);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE baby_id = ?"),
      ["baby-123"],
    );
  });

  test("requests diaper events newest first", async () => {
    await getDiaperEventsByBaby("baby-123");

    const sql = mockGetAllAsync.mock.calls[0][0];

    expect(sql).toContain("ORDER BY timestamp DESC");
  });

  test("updates a diaper event without changing its ID", async () => {
    const result = await updateDiaperEvent({
      ...diaper,
      diaper_type: "both",
    });

    expect(result).toBe(true);

    const [sql, params] = mockRunAsync.mock.calls[0];

    expect(sql).toContain("UPDATE diaper_events");
    expect(sql).toContain("WHERE id = ?");
    expect(params[1]).toBe("both");
    expect(params[4]).toBe("diaper-123");
  });

  test("returns false when an update affects no records", async () => {
    mockRunAsync.mockResolvedValue({ changes: 0 });

    const result = await updateDiaperEvent(diaper);

    expect(result).toBe(false);
  });

  test("deletes a diaper event by its unique ID", async () => {
    const result = await deleteDiaperEvent("diaper-123");

    expect(result).toBe(true);
    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM diaper_events"),
      ["diaper-123"],
    );
  });

  test("returns false when deleting a missing diaper event", async () => {
    mockRunAsync.mockResolvedValue({ changes: 0 });

    const result = await deleteDiaperEvent("missing");

    expect(result).toBe(false);
  });

  test("propagates database errors", async () => {
    mockRunAsync.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    await expect(
      createDiaperEvent(diaper),
    ).rejects.toThrow("Database unavailable");
  });
});
