
import { getDatabase } from "./database";
import { deleteEventAndPhotos } from "./eventDeletion";
import { cleanupStoredPhotoFiles } from "./photoStorage";

jest.mock("./database", () => ({ getDatabase: jest.fn() }));
jest.mock("./photoStorage", () => ({
  cleanupStoredPhotoFiles: jest.fn(),
}));

const runAsync = jest.fn();
const getAllAsync = jest.fn();
const transaction = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  runAsync.mockResolvedValue({ changes: 1 });
  getAllAsync.mockResolvedValue([]);

  transaction.mockImplementation(async (callback) =>
    callback({
      runAsync,
      getAllAsync,
    }),
  );

  (getDatabase as jest.Mock).mockResolvedValue({
    withExclusiveTransactionAsync: transaction,
  });
});

describe("event deletion and photo integrity", () => {
  test.each([
    ["feeding", "feeding_events"],
    ["diaper", "diaper_events"],
    ["measurement", "measurements"],
  ] as const)(
    "deletes %s and its associated photo rows",
    async (kind, table) => {
      getAllAsync.mockResolvedValue([
        { file_uri: "image-a.jpg" },
      ]);

      expect(
        await deleteEventAndPhotos(kind, "event-1"),
      ).toBe(true);

      expect(transaction).toHaveBeenCalledTimes(1);

      expect(runAsync).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(`DELETE FROM ${table}`),
        ["event-1"],
      );

      expect(getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("FROM photo_attachments"),
        ["event-1", kind],
      );

      expect(runAsync).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("DELETE FROM photo_attachments"),
        ["event-1", kind],
      );

      expect(cleanupStoredPhotoFiles).toHaveBeenCalledWith([
        "image-a.jpg",
      ]);

      // Physical files must be deleted only after DB operations.
      expect(
        runAsync.mock.invocationCallOrder[1],
      ).toBeLessThan(
        (cleanupStoredPhotoFiles as jest.Mock)
          .mock.invocationCallOrder[0],
      );
    },
  );

  test("leaves photos untouched if event is missing", async () => {
    runAsync.mockResolvedValue({ changes: 0 });

    expect(
      await deleteEventAndPhotos("feeding", "missing"),
    ).toBe(false);

    expect(getAllAsync).not.toHaveBeenCalled();
    expect(cleanupStoredPhotoFiles).not.toHaveBeenCalled();
  });

  test("does not delete files when an SQL statement fails", async () => {
    getAllAsync.mockResolvedValue([
      { file_uri: "image-a.jpg" },
    ]);

    runAsync.mockResolvedValueOnce({ changes: 1 });
    runAsync.mockRejectedValueOnce(new Error("SQL failed"));

    await expect(
      deleteEventAndPhotos("diaper", "event-1"),
    ).rejects.toThrow("SQL failed");

    expect(cleanupStoredPhotoFiles).not.toHaveBeenCalled();
  });

  test("rejects a blank ID", async () => {
    await expect(
      deleteEventAndPhotos("feeding", " "),
    ).rejects.toThrow("An event ID is required.");

    expect(getDatabase).not.toHaveBeenCalled();
  });
});
