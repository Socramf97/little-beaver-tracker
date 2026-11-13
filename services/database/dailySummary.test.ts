
import { getDatabase } from "./database";
import { getDailySummary } from "./dailySummary";

jest.mock("./database", () => ({
  getDatabase: jest.fn(),
}));

const mockGetDatabase = getDatabase as jest.Mock;

const mockGetAllAsync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  mockGetDatabase.mockResolvedValue({
    getAllAsync: mockGetAllAsync,
  });
});

describe("getDailySummary", () => {
  const babyId = "baby-123";
  const date = "2026-11-13";

  test("returns feeding and diaper totals", async () => {
    mockGetAllAsync
      .mockResolvedValueOnce([
        {
          feeding_type: "bottle",
          unit: "mL",
          count: 2,
          total_amount: 180,
        },
        {
          feeding_type: "breast",
          unit: null,
          count: 1,
          total_amount: null,
        },
      ])
      .mockResolvedValueOnce([
        { diaper_type: "pee", count: 3 },
        { diaper_type: "poop", count: 1 },
      ]);

    const result = await getDailySummary(babyId, date);

    expect(result.feedingCount).toBe(3);
    expect(result.diaperCount).toBe(4);
    expect(result.feedings).toHaveLength(2);
    expect(result.diapers).toHaveLength(2);
  });

  test("returns zero totals for an empty day", async () => {
    mockGetAllAsync.mockResolvedValue([]);

    const result = await getDailySummary(babyId, date);

    expect(result.feedingCount).toBe(0);
    expect(result.diaperCount).toBe(0);
    expect(result.feedings).toEqual([]);
    expect(result.diapers).toEqual([]);
  });

  test("filters both queries by baby and date", async () => {
    mockGetAllAsync.mockResolvedValue([]);

    await getDailySummary(babyId, date);

    expect(mockGetAllAsync).toHaveBeenCalledTimes(2);

    const expectedParams = [
      "baby-123",
      "2026-11-13T00:00:00.000Z",
      "2026-11-14T00:00:00.000Z",
    ];

    expect(mockGetAllAsync.mock.calls[0][1])
      .toEqual(expectedParams);

    expect(mockGetAllAsync.mock.calls[1][1])
      .toEqual(expectedParams);
  });

  test("uses separate feeding and diaper tables", async () => {
    mockGetAllAsync.mockResolvedValue([]);

    await getDailySummary(babyId, date);

    const feedingSql = mockGetAllAsync.mock.calls[0][0];
    const diaperSql = mockGetAllAsync.mock.calls[1][0];

    expect(feedingSql).toContain("FROM feeding_events");
    expect(diaperSql).toContain("FROM diaper_events");
    expect(feedingSql).toContain("GROUP BY feeding_type, unit");
    expect(diaperSql).toContain("GROUP BY diaper_type");
  });

  test("rejects an empty baby ID", async () => {
    await expect(
      getDailySummary("  ", date)
    ).rejects.toThrow("A baby ID is required.");

    expect(mockGetDatabase).not.toHaveBeenCalled();
  });

  test("rejects incorrectly formatted dates", async () => {
    await expect(
      getDailySummary(babyId, "11/13/2026")
    ).rejects.toThrow("Date must be YYYY-MM-DD.");

    expect(mockGetDatabase).not.toHaveBeenCalled();
  });

  test("rejects impossible calendar dates", async () => {
    await expect(
      getDailySummary(babyId, "2026-02-30")
    ).rejects.toThrow("Date must be a valid calendar date.");

    expect(mockGetDatabase).not.toHaveBeenCalled();
  });

  test("handles leap-day boundaries", async () => {
    mockGetAllAsync.mockResolvedValue([]);

    await getDailySummary(babyId, "2028-02-29");

    const params = mockGetAllAsync.mock.calls[0][1];

    expect(params[1]).toBe("2028-02-29T00:00:00.000Z");
    expect(params[2]).toBe("2028-03-01T00:00:00.000Z");
  });

  test("propagates database errors", async () => {
    mockGetAllAsync.mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    await expect(
      getDailySummary(babyId, date)
    ).rejects.toThrow("Database unavailable");
  });
});
