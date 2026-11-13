
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";

import {
  createPhotoAttachment,
  deletePhotoAttachment,
  getPhotoById,
  getPhotosByBaby,
  getPhotosByEvent,
  type PhotoAttachment,
  type PhotoEventType,
} from "./photos";

const PHOTO_DIRECTORY = "baby-photos";

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

  const destination = new File(
    directory,
    `${photoId}.${extension}`,
  );

  const source = new File(input.sourceUri);

  // Copy rather than move: the original photo remains intact.
  source.copy(destination);

  try {
    await createPhotoAttachment({
      id: photoId,
      baby_id: input.babyId,
      file_uri: destination.uri,
      event_id: input.eventId ?? null,
      event_type: input.eventType ?? null,
      created_at: createdAt,
    });
  } catch (error) {
    // Avoid leaving an orphaned file if database insertion fails.
    if (destination.exists) {
      destination.delete();
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
  return getPhotosByBaby(babyId);
}

/**
 * Retrieves photos linked to a specific event.
 */
export async function listEventPhotos(
  eventId: string,
  eventType: PhotoEventType,
): Promise<PhotoAttachment[]> {
  return getPhotosByEvent(eventId, eventType);
}

/**
 * Removes a photo attachment and its stored file.
 */

export async function removePhoto(photoId: string): Promise<boolean> {
  const photo = await getPhotoById(photoId);

  if (!photo) {
    return false;
  }

  const file = new File(photo.file_uri);

  // Delete the physical file before removing its database record.
  if (file.exists) {
    file.delete();
  }

  const deletedUri = await deletePhotoAttachment(photoId);
  return deletedUri !== null;
}

