
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";

import {
  createPhotoAttachment,
  deletePhotoAttachment,
  getPhotosByBaby,
  getPhotosByEvent,
  type PhotoAttachment,
  type PhotoEventType,
} from "./photos";

const PHOTO_DIRECTORY = "baby-photos";

// Build the current device's full URI from a stored filename.
function resolvePhotoUri(filename: string): string {
  return new File(
    new Directory(Paths.document, PHOTO_DIRECTORY),
    filename,
  ).uri;
}


/**
 * Deletes photos from our managed storage directory.
 * Only accepts filenames, not absolute paths.
 * Call after the database transaction commits.
 */
export function cleanupStoredPhotoFiles(filenames: string[]): void {
  for (const filename of new Set(filenames)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.(jpg|jpeg|png|webp|heic)$/i.test(filename)) {
      console.warn("Skipping unmanaged photo path during cleanup:", filename);
      continue;
    }

    try {
      const file = new File(
        new Directory(Paths.document, PHOTO_DIRECTORY),
        filename,
      );

      if (file.exists) file.delete();
    } catch (error) {
      console.warn("Photo record deleted, but file cleanup failed:", error);
    }
  }
}

export interface SavePhotoInput {
  babyId: string;
  sourceUri: string;
  eventId?: string;
  eventType?: PhotoEventType;
}

/**
 * Copies a selected photo into persistent app storage
 * and creates its database attachment record.
 */
export async function savePhoto(
  input: SavePhotoInput,
): Promise<PhotoAttachment> {
  if (!input.babyId.trim() || !input.sourceUri.trim()) {
    throw new Error("Baby ID and source URI are required.");
  }

  const photoId = Crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const directory = new Directory(
    Paths.document,
    PHOTO_DIRECTORY,
  );

  directory.create({ idempotent: true, intermediates: true });

  // Preserve common image extensions.
  const sourcePath = input.sourceUri.split("?")[0];
  const extensionMatch = sourcePath.match(
    /\.(jpg|jpeg|png|webp|heic)$/i,
  );

  const extension = extensionMatch
    ? extensionMatch[1].toLowerCase()
    : "jpg";

  const filename = `${photoId}.${extension}`;
  const destination = new File(directory, filename);

  const source = new File(input.sourceUri);

  // Copy rather than move: the original photo remains intact.
  // Clean up a partial copy if either operation fails.
  try {
    source.copy(destination);
    await createPhotoAttachment({
      id: photoId,
      baby_id: input.babyId,
      file_uri: filename,
      event_id: input.eventId ?? null,
      event_type: input.eventType ?? null,
      created_at: createdAt,
    });
  } catch (error) {
    try {
      if (destination.exists) destination.delete();
    } catch (cleanupError) {
      console.warn("Could not clean up failed photo copy:", cleanupError);
    }
    throw error;
  }
  return {
    id: photoId,
    baby_id: input.babyId,
    event_id: input.eventId ?? null,
    event_type: input.eventType ?? null,
    file_uri: destination.uri,
    created_at: createdAt,
  };
}

/**
 * Retrieves photos belonging to one baby.
 */
export async function listBabyPhotos(
  babyId: string,
): Promise<PhotoAttachment[]> {
  const photos = await getPhotosByBaby(babyId);

  return photos.map((photo) => ({
    ...photo,
    file_uri: resolvePhotoUri(photo.file_uri),
  }));
}

/**
 * Retrieves photos linked to a specific event.
 */
export async function listEventPhotos(
  eventId: string,
  eventType: PhotoEventType,
): Promise<PhotoAttachment[]> {
  const photos = await getPhotosByEvent(eventId, eventType);

  return photos.map((photo) => ({
    ...photo,
    file_uri: resolvePhotoUri(photo.file_uri),
  }));
}

/**
 * Removes a photo attachment and its stored file.
 */

export async function removePhoto(photoId: string): Promise<boolean> {
  let filename: string | null;

  // Delete the database record first.
  try {
    filename = await deletePhotoAttachment(photoId);
  } catch (error) {
    console.error("Failed to delete photo record:", error);
    throw error;
  }

  if (filename === null) {
    return false;
  }

  // Remove the managed image file after deleting its DB record.
  cleanupStoredPhotoFiles([filename]);

  return true;
}
