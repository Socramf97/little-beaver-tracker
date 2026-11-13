
import { getDatabase } from "./database";
import {
    createFeedingEvent,
    deleteFeedingEvent,
    getFeedingEventsByBaby,
    updateFeedingEvent,
} from "./feedings";

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

describe("Feeding event database operations", () => {
  const feeding = {
    id: "feeding-123",
    baby_id: "baby-123",
    feeding_type: "bottle",
    amount: 120,
    unit: "mL",
    is_approximate: false,
    notes: "Morning feeding",
    timestamp: "2026-11-13T08:00:00.000Z",
  };

  test("creates a feeding linked to the correct baby", async () => {
    await createFeedingEvent(feeding);

    const [sql, params] = mockRunAsync.mock.calls[0];

    expect(sql).toContain("INSERT INTO feeding_events");
    expect(params).toEqual([
      "feeding-123",
      "baby-123",
      "bottle",
      120,
      "mL",
      0,
      "Morning feeding",
      "2026-11-13T08:00:00.000Z",
    ]);
  });

  test("uses defaults for optional feeding fields", async () => {
    await createFeedingEvent({
      id: "feeding-456",
      baby_id: "baby-123",
      feeding_type: "breast",
    });

    const params = mockRunAsync.mock.calls[0][1];

    expect(params[3]).toBeNull();
    expect(params[4]).toBeNull();
    expect(params[5]).toBe(0);
    expect(params[6]).toBeNull();
    expect(Number.isNaN(Date.parse(params[7]))).toBe(false);
  });

  test("retrieves only the selected baby's feedings", async () => {
    mockGetAllAsync.mockResolvedValue([feeding]);

    const result = await getFeedingEventsByBaby("baby-123");

    expect(result).toEqual([feeding]);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE baby_id = ?"),
      ["baby-123"],
    );
  });

  test("requests feedings newest first", async () => {
    await getFeedingEventsByBaby("baby-123");

    const sql = mockGetAllAsync.mock.calls[0][0];

    expect(sql).toContain("ORDER BY timestamp DESC");
  });

  test("updates a feeding without changing its ID", async () => {
    const result = await updateFeedingEvent({
      ...feeding,
      amount: 150,
    });

    expect(result).toBe(true);

    const [sql, params] = mockRunAsync.mock.calls[0];

    expect(sql).toContain("UPDATE feeding_events");
    expect(sql).toContain("WHERE id = ?");
    expect(params[2]).toBe(150);
    expect(params[7]).toBe("feeding-123");
  });

  test("returns false when an update affects no records", async () => {
    mockRunAsync.mockResolvedValue({ changes: 0 });

    const result = await updateFeedingEvent(feeding);

    expect(result).toBe(false);
  });

  test("deletes a feeding by its unique ID", async () => {
    const result = await deleteFeedingEvent("feeding-123");

    expect(result).toBe(true);
    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM feeding_events"),
      ["feeding-123"],
    );
  });

  test("returns false when deleting a missing feeding", async () => {
    mockRunAsync.mockResolvedValue({ changes: 0 });

    const result = await deleteFeedingEvent("missing");

    expect(result).toBe(false);
  });

  test("propagates database errors", async () => {
    mockRunAsync.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    await expect(
      createFeedingEvent(feeding),
    ).rejects.toThrow("Database unavailable");
  });
});
