
import { getDatabase } from "./database";
import {
    createPhotoAttachment,
    deletePhotoAttachment,
    getPhotosByBaby,
    getPhotosByEvent,
} from "./photos";

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
  mockGetAllAsync.mockResolvedValue([]);
});

describe("Photo attachment database operations", () => {
  const photo = {
    id: "photo-123",
    baby_id: "baby-123",
    file_uri: "file:///photos/photo-123.jpg",
    created_at: "2026-11-13T12:00:00.000Z",
  };

  test("creates a baby-level photo attachment", async () => {
    await createPhotoAttachment(photo);

    expect(mockRunAsync).toHaveBeenCalledTimes(1);

    const [sql, params] = mockRunAsync.mock.calls[0];

    expect(sql).toContain("INSERT INTO photo_attachments");
    expect(params).toEqual([
      photo.id,
      photo.baby_id,
      null,
      null,
      photo.file_uri,
      photo.created_at,
    ]);
  });

  test("validates an event belongs to the baby", async () => {
    mockGetFirstAsync.mockResolvedValue({ id: "feeding-1" });

    await createPhotoAttachment({
      ...photo,
      event_id: "feeding-1",
      event_type: "feeding",
    });

    expect(mockGetFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("FROM feeding_events"),
      ["feeding-1", "baby-123"],
    );

    expect(mockRunAsync).toHaveBeenCalledTimes(1);
  });

  test("rejects an event belonging to another baby", async () => {
    mockGetFirstAsync.mockResolvedValue(null);

    await expect(
      createPhotoAttachment({
        ...photo,
        event_id: "feeding-1",
        event_type: "feeding",
      }),
    ).rejects.toThrow(
      "Event does not exist or belongs to another baby.",
    );

    expect(mockRunAsync).not.toHaveBeenCalled();
  });

  test("requires event ID and type together", async () => {
    await expect(
      createPhotoAttachment({
        ...photo,
        event_id: "feeding-1",
      }),
    ).rejects.toThrow(
      "Event ID and event type must be provided together.",
    );

    expect(mockRunAsync).not.toHaveBeenCalled();
  });

  test("rejects missing photo identifiers", async () => {
    await expect(
      createPhotoAttachment({
        ...photo,
        id: " ",
      }),
    ).rejects.toThrow(
      "Photo ID and baby ID are required.",
    );

    expect(mockGetDatabase).not.toHaveBeenCalled();
  });

  test("retrieves photos for the selected baby", async () => {
    mockGetAllAsync.mockResolvedValue([photo]);

    const result = await getPhotosByBaby("baby-123");

    expect(result).toEqual([photo]);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("FROM photo_attachments"),
      ["baby-123"],
    );
  });

  test("retrieves photos for a specific event", async () => {
    mockGetAllAsync.mockResolvedValue([photo]);

    const result = await getPhotosByEvent(
      "feeding-1",
      "feeding",
    );

    expect(result).toHaveLength(1);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE event_id = ? AND event_type = ?"),
      ["feeding-1", "feeding"],
    );
  });

  test("deletes an existing photo record", async () => {
    mockGetFirstAsync.mockResolvedValue({
      file_uri: photo.file_uri,
    });

    const result = await deletePhotoAttachment(photo.id);

    expect(result).toBe(photo.file_uri);
    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM photo_attachments"),
      [photo.id],
    );
  });

  test("returns null when a photo does not exist", async () => {
    mockGetFirstAsync.mockResolvedValue(null);

    const result = await deletePhotoAttachment("missing");

    expect(result).toBeNull();
    expect(mockRunAsync).not.toHaveBeenCalled();
  });
});
