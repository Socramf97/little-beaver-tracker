import { getDatabase } from "./database";
import { cleanupStoredPhotoFiles } from "./photoStorage";
import type { PhotoEventType } from "./photos";

const EVENT_TABLES: Record<PhotoEventType, string> = {
  feeding: "feeding_events",
  diaper: "diaper_events",
  measurement: "measurements",
};

/**
 * Deletes an event and its photo attachment rows in one transaction.
 * The associated managed image files are removed only after commit.
 * Returns false if the event did not exist.
 */
export async function deleteEventAndPhotos(
  eventType: PhotoEventType,
  eventId: string,
): Promise<boolean> {
  if (!eventId.trim()) throw new Error("An event ID is required.");

  const db = await getDatabase();
  let deleted = false;
  let filenames: string[] = [];
  await db.withExclusiveTransactionAsync(async (tx) => {
    // Table names come only from this fixed allowlist, not user input.
      const result = await tx.runAsync(
        `DELETE FROM ${EVENT_TABLES[eventType]} WHERE id = ?`,
        [eventId],
      );
      if (result.changes === 0) return;

      const photos = await tx.getAllAsync<{ file_uri: string }>(
        `SELECT file_uri FROM photo_attachments
         WHERE event_id = ? AND event_type = ?`,
        [eventId, eventType],
      );
      await tx.runAsync(
        `DELETE FROM photo_attachments
         WHERE event_id = ? AND event_type = ?`,
        [eventId, eventType],
      );
      deleted = true;
      filenames = photos.map((photo) => photo.file_uri);
  });

  if (deleted) cleanupStoredPhotoFiles(filenames);
  return deleted;
}
