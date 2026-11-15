
import { getDatabase } from "./database";

export type PhotoEventType =
  | "feeding"
  | "diaper"
  | "measurement";

export interface PhotoAttachment {
  id: string;
  baby_id: string;
  event_id: string | null;
  event_type: PhotoEventType | null;
  file_uri: string;
  created_at: string;
}

export interface NewPhotoAttachment {
  id: string;
  baby_id: string;
  file_uri: string;
  event_id?: string | null;
  event_type?: PhotoEventType | null;
  created_at?: string;
}

const EVENT_TABLES: Record<PhotoEventType, string> = {
  feeding: "feeding_events",
  diaper: "diaper_events",
  measurement: "measurements",
};

/**
 * Saves a photo attachment record.
 * The actual image file must already exist at file_uri.
 */
export async function createPhotoAttachment(
  photo: NewPhotoAttachment,
): Promise<void> {
  if (!photo.id.trim() || !photo.baby_id.trim()) {
    throw new Error("Photo ID and baby ID are required.");
  }

  if (!photo.file_uri.trim()) {
    throw new Error("Photo file URI is required.");
  }

  const eventId = photo.event_id ?? null;
  const eventType = photo.event_type ?? null;

  if ((eventId === null) !== (eventType === null)) {
    throw new Error(
      "Event ID and event type must be provided together.",
    );
  }

  const db = await getDatabase();

  if (eventId !== null && eventType !== null) {
    const table = EVENT_TABLES[eventType];

    if (!table) {
      throw new Error("Unsupported event type.");
    }

    const event = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM ${table}
       WHERE id = ? AND baby_id = ?`,
      [eventId, photo.baby_id],
    );

    if (!event) {
      throw new Error(
        "Event does not exist or belongs to another baby.",
      );
    }
  }

  await db.runAsync(
    `INSERT INTO photo_attachments
       (id, baby_id, event_id, event_type,
        file_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      photo.id,
      photo.baby_id,
      eventId,
      eventType,
      photo.file_uri,
      photo.created_at ?? new Date().toISOString(),
    ],
  );
}

/**
 * Returns all photos associated with a baby.
 */
export async function getPhotosByBaby(
  babyId: string,
): Promise<PhotoAttachment[]> {
  const db = await getDatabase();

  return db.getAllAsync<PhotoAttachment>(
    `SELECT * FROM photo_attachments
     WHERE baby_id = ?
     ORDER BY created_at DESC`,
    [babyId],
  );
}

/**
 * Returns photos attached to a specific event.
 */
export async function getPhotosByEvent(
  eventId: string,
  eventType: PhotoEventType,
): Promise<PhotoAttachment[]> {
  const db = await getDatabase();

  return db.getAllAsync<PhotoAttachment>(
    `SELECT * FROM photo_attachments
     WHERE event_id = ? AND event_type = ?
     ORDER BY created_at DESC`,
    [eventId, eventType],
  );
}

/**
 * Deletes an attachment record and returns its URI.
 * The calling file-storage service can then delete
 * the corresponding image file.
 */


export async function getPhotoById(
  id: string,
): Promise<PhotoAttachment | null> {
  const db = await getDatabase();

  return db.getFirstAsync<PhotoAttachment>(
    `SELECT * FROM photo_attachments WHERE id = ?`,
    [id],
  );
}

export async function deletePhotoAttachment(
  id: string,
): Promise<string | null> {
  const db = await getDatabase();

  const photo = await db.getFirstAsync<{
    file_uri: string;
  }>(
    `SELECT file_uri FROM photo_attachments WHERE id = ?`,
    [id],
  );

  if (!photo) {
    return null;
  }

  const result = await db.runAsync(
    `DELETE FROM photo_attachments WHERE id = ?`,
    [id],
  );

  return result.changes > 0 ? photo.file_uri : null;
}
