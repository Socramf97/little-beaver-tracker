
import {
    createBaby,
    getAllBabies,
    getBabyById,
    deleteBaby,
} from "./babies";
import { getDatabase } from "./database";
import { cleanupStoredPhotoFiles } from "./photoStorage";

jest.mock("./database", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("./photoStorage", () => ({
  cleanupStoredPhotoFiles: jest.fn(),
}));

const mockGetDatabase = getDatabase as jest.Mock;

const mockTransaction = jest.fn();
const mockRunAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockGetAllAsync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  mockGetDatabase.mockResolvedValue({
    runAsync: mockRunAsync,
    getFirstAsync: mockGetFirstAsync,
    getAllAsync: mockGetAllAsync,
    withExclusiveTransactionAsync: mockTransaction,
  });

  mockGetAllAsync.mockResolvedValue([]);

  mockTransaction.mockImplementation(async (callback) =>
    callback({
      getAllAsync: mockGetAllAsync,
      runAsync: mockRunAsync,
    }),
  );

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


  test("deletes baby and related data in one transaction", async () => {
    mockGetAllAsync.mockResolvedValue([
      { file_uri: "photo-a.jpg" },
      { file_uri: "photo-b.png" },
    ]);

    await deleteBaby("baby-123");

    expect(mockTransaction).toHaveBeenCalledTimes(1);

    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("FROM photo_attachments"),
      ["baby-123"],
    );

    expect(mockRunAsync.mock.calls.map(([sql]) => sql)).toEqual([
      expect.stringContaining("DELETE FROM photo_attachments"),
      expect.stringContaining("DELETE FROM feeding_events"),
      expect.stringContaining("DELETE FROM diaper_events"),
      expect.stringContaining("DELETE FROM measurements"),
      expect.stringContaining("DELETE FROM babies"),
    ]);

    expect(
      mockRunAsync.mock.calls.every(
        ([, params]) => params.length === 1 && params[0] === "baby-123",
      ),
    ).toBe(true);

    expect(cleanupStoredPhotoFiles).toHaveBeenCalledWith([
      "photo-a.jpg",
      "photo-b.png",
    ]);

    const sqlCallOrder = mockRunAsync.mock.invocationCallOrder;

    expect(sqlCallOrder[sqlCallOrder.length - 1]).toBeLessThan(
      (cleanupStoredPhotoFiles as jest.Mock).mock.invocationCallOrder[0],
    );
  });

  test("does not remove photos if a database deletion fails", async () => {
    mockGetAllAsync.mockResolvedValue([
      { file_uri: "photo-a.jpg" },
    ]);

    mockRunAsync.mockRejectedValueOnce(
      new Error("Transaction failed"),
    );

    await expect(
      deleteBaby("baby-123"),
    ).rejects.toThrow("Transaction failed");

    expect(cleanupStoredPhotoFiles).not.toHaveBeenCalled();
  });

  test("rejects blank baby IDs before starting a transaction", async () => {
    await expect(
      deleteBaby(" "),
    ).rejects.toThrow("A baby ID is required.");

    expect(mockGetDatabase).not.toHaveBeenCalled();
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
