
import * as Crypto from "expo-crypto";
import { Directory, File } from "expo-file-system";

import {
  listBabyPhotos,
  listEventPhotos,
  removePhoto,
  savePhoto,
} from "./photoStorage";

import {
  createPhotoAttachment,
  deletePhotoAttachment,
  getPhotosByBaby,
  getPhotosByEvent
} from "./photos";

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(),
}));

jest.mock("expo-file-system", () => ({
  Paths: { document: "file:///documents/" },
  Directory: jest.fn(),
  File: jest.fn(),
}));

jest.mock("./photos", () => ({
  createPhotoAttachment: jest.fn(),
  deletePhotoAttachment: jest.fn(),
  getPhotosByBaby: jest.fn(),
  getPhotosByEvent: jest.fn(),
}));

const mockCreate = createPhotoAttachment as jest.Mock;
const mockDelete = deletePhotoAttachment as jest.Mock;
const mockGetBaby = getPhotosByBaby as jest.Mock;
const mockGetEvent = getPhotosByEvent as jest.Mock;

const mockCopy = jest.fn();
const mockFileDelete = jest.fn();
const mockDirectoryCreate = jest.fn();

const mockFile = jest.mocked(File);
const mockDirectory = jest.mocked(Directory);

beforeEach(() => {
  jest.clearAllMocks();

  jest.mocked(Crypto.randomUUID).mockReturnValue(
  "123e4567-e89b-42d3-a456-426614174000",
  );

  mockDirectory.mockImplementation(
  () =>
    ({
      create: mockDirectoryCreate,
    }) as unknown as Directory,
  );

  mockFile.mockImplementation((...args) => {
  const filename = args[args.length - 1] as string;

  return {
    uri: filename.startsWith("file:")
      ? filename
      : `file:///documents/baby-photos/${filename}`,
    exists: true,
    copy: mockCopy,
    delete: mockFileDelete,
  } as unknown as File;
});

  mockCreate.mockResolvedValue(undefined);
});

describe("Photo file storage", () => {
  test("copies a photo and creates its database record", async () => {
    const result = await savePhoto({
      babyId: "baby-123",
      sourceUri: "file:///cache/image.png",
    });

    expect(mockDirectoryCreate).toHaveBeenCalledWith({
      idempotent: true,
      intermediates: true,
    });

    expect(mockCopy).toHaveBeenCalledTimes(1);


    expect(mockCreate).toHaveBeenCalledWith(
    expect.objectContaining({
        id: "123e4567-e89b-42d3-a456-426614174000",
        baby_id: "baby-123",
        event_id: null,
        event_type: null,
        file_uri: "123e4567-e89b-42d3-a456-426614174000.png",
    }),
    );

    expect(result.id).toBe(
    "123e4567-e89b-42d3-a456-426614174000",
    );
    expect(result.file_uri).toBe(
      "file:///documents/baby-photos/123e4567-e89b-42d3-a456-426614174000.png",
    );
  });

  test("links a saved photo to a feeding event", async () => {
    await savePhoto({
      babyId: "baby-123",
      sourceUri: "file:///cache/image.jpg",
      eventId: "feeding-1",
      eventType: "feeding",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "feeding-1",
        event_type: "feeding",
      }),
    );
  });

  test("deletes copied file if database insertion fails", async () => {
    mockCreate.mockRejectedValueOnce(
      new Error("Database error"),
    );

    await expect(
      savePhoto({
        babyId: "baby-123",
        sourceUri: "file:///cache/image.jpg",
      }),
    ).rejects.toThrow("Database error");

    expect(mockFileDelete).toHaveBeenCalledTimes(1);
  });

  test("rejects missing input", async () => {
    await expect(
      savePhoto({
        babyId: "",
        sourceUri: "file:///cache/image.jpg",
      }),
    ).rejects.toThrow(
      "Baby ID and source URI are required.",
    );

    expect(mockCopy).not.toHaveBeenCalled();
  });

  test("lists photos for a baby with full file URIs", async () => {
    const photos = [
      {
        id: "photo-123",
        file_uri: "photo-123.jpg",
      },
    ];
  
    mockGetBaby.mockResolvedValue(photos);
  
    const result = await listBabyPhotos("baby-123");
  
    expect(mockGetBaby).toHaveBeenCalledWith("baby-123");
  
    expect(result).toEqual([
      {
        id: "photo-123",
        file_uri: "file:///documents/baby-photos/photo-123.jpg",
      },
  ]);
});


  test("lists event photos with full file URIs", async () => {
    mockGetEvent.mockResolvedValue([
      {
        id: "photo-456",
        file_uri: "photo-456.jpg",
      },
    ]);
  
    const result = await listEventPhotos(
      "feeding-1",
      "feeding",
    );
  
    expect(mockGetEvent).toHaveBeenCalledWith(
      "feeding-1",
      "feeding",
    );
  
    expect(result).toEqual([
      {
        id: "photo-456",
        file_uri: "file:///documents/baby-photos/photo-456.jpg",
      },
    ]);
  });




  test("deletes database record before photo file", async () => {
    mockDelete.mockResolvedValue("photo-123.jpg");
  
    const result = await removePhoto("photo-123");
  
    expect(result).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith("photo-123");
    expect(mockFileDelete).toHaveBeenCalledTimes(1);
  
    expect(
      mockDelete.mock.invocationCallOrder[0],
    ).toBeLessThan(
      mockFileDelete.mock.invocationCallOrder[0],
    );
  });
  
  test("returns false when photo does not exist", async () => {
    mockDelete.mockResolvedValue(null);
  
    const result = await removePhoto("missing");
  
    expect(result).toBe(false);
    expect(mockDelete).toHaveBeenCalledWith("missing");
    expect(mockFileDelete).not.toHaveBeenCalled();
  });
  
  test("preserves photo file if database deletion fails", async () => {
    mockDelete.mockRejectedValueOnce(
      new Error("Database deletion failed"),
    );
  
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
  
    try {
      await expect(
        removePhoto("photo-123"),
      ).rejects.toThrow("Database deletion failed");
  
      expect(mockFileDelete).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
  
  test("handles file deletion failure after database deletion", async () => {
    mockDelete.mockResolvedValue("photo-123.jpg");
  
    mockFileDelete.mockImplementationOnce(() => {
      throw new Error("File deletion failed");
    });
  
    const warnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
  
    try {
      const result = await removePhoto("photo-123");
  
      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith("photo-123");
      expect(mockFileDelete).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });
