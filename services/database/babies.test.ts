
import {
    createBaby,
    getAllBabies,
    getBabyById,
} from "./babies";
import { getDatabase } from "./database";

jest.mock("./database", () => ({
  getDatabase: jest.fn(),
}));

const mockGetDatabase = getDatabase as jest.Mock;

const mockRunAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockGetAllAsync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  mockGetDatabase.mockResolvedValue({
    runAsync: mockRunAsync,
    getFirstAsync: mockGetFirstAsync,
    getAllAsync: mockGetAllAsync,
  });

  mockRunAsync.mockResolvedValue({ changes: 1 });
});

describe("Baby database operations", () => {
  const baby = {
    id: "baby-123",
    name: "Alex",
    birth_date: "2026-01-15",
  };

  test("creates a baby with the correct profile information", async () => {
    await createBaby(baby);

    expect(mockRunAsync).toHaveBeenCalledTimes(1);

    const [sql, params] = mockRunAsync.mock.calls[0];

    expect(sql).toContain("INSERT INTO babies");
    expect(params[0]).toBe("baby-123");
    expect(params[1]).toBe("Alex");
    expect(params[2]).toBe("2026-01-15");
    expect(params[3]).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(params[3]))).toBe(false);
  });

  test("allows a baby without a birth date", async () => {
    await createBaby({
      id: "baby-456",
      name: "Sam",
    });

    const params = mockRunAsync.mock.calls[0][1];

    expect(params[2]).toBeNull();
  });

  test("retrieves the correct baby by ID", async () => {
    const storedBaby = {
      ...baby,
      created_at: "2026-11-13T12:00:00.000Z",
    };

    mockGetFirstAsync.mockResolvedValue(storedBaby);

    const result = await getBabyById("baby-123");

    expect(result).toEqual(storedBaby);
    expect(mockGetFirstAsync).toHaveBeenCalledWith(
      "SELECT * FROM babies WHERE id = ?",
      ["baby-123"],
    );
  });

  test("returns null when the baby does not exist", async () => {
    mockGetFirstAsync.mockResolvedValue(null);

    const result = await getBabyById("missing-baby");

    expect(result).toBeNull();
  });

  test("retrieves all babies in creation order", async () => {
    const babies = [
      {
        ...baby,
        created_at: "2026-11-13T12:00:00.000Z",
      },
      {
        id: "baby-456",
        name: "Sam",
        birth_date: null,
        created_at: "2026-11-12T12:00:00.000Z",
      },
    ];

    mockGetAllAsync.mockResolvedValue(babies);

    const result = await getAllBabies();

    expect(result).toEqual(babies);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      "SELECT * FROM babies ORDER BY created_at DESC",
    );
  });

  test("returns an empty list when no babies exist", async () => {
    mockGetAllAsync.mockResolvedValue([]);

    const result = await getAllBabies();

    expect(result).toEqual([]);
  });

  test("propagates database errors", async () => {
    mockRunAsync.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    await expect(
      createBaby(baby),
    ).rejects.toThrow("Database unavailable");
  });
});
