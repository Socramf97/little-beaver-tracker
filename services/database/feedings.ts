import { getDatabase } from "./database";

export interface FeedingEvent {
  id: string;
  baby_id: string;
  feeding_type: string;
  amount: number | null;
  unit: string | null;
  is_approximate: number;
  notes: string | null;
  timestamp: string;
}

export interface NewFeedingEvent {
  id: string;
  baby_id: string;
  feeding_type: string;
  amount?: number | null;
  unit?: string | null;
  is_approximate?: boolean;
  notes?: string | null;
  timestamp?: string;
}

export async function createFeedingEvent(
  event: NewFeedingEvent,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO feeding_events
      (id, baby_id, feeding_type, amount, unit,
       is_approximate, notes, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.baby_id,
      event.feeding_type,
      event.amount ?? null,
      event.unit ?? null,
      event.is_approximate ? 1 : 0,
      event.notes ?? null,
      event.timestamp ?? new Date().toISOString(),
    ],
  );
}

export async function getFeedingEventsByBaby(
  babyId: string,
): Promise<FeedingEvent[]> {
  const db = await getDatabase();

  return db.getAllAsync<FeedingEvent>(
    `SELECT * FROM feeding_events
     WHERE baby_id = ?
     ORDER BY timestamp DESC`,
    [babyId],
  );
}

export async function updateFeedingEvent(
  event: NewFeedingEvent & { timestamp: string },
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `UPDATE feeding_events
     SET baby_id = ?, feeding_type = ?, amount = ?, unit = ?,
       is_approximate = ?, notes = ?, timestamp = ?
      WHERE id = ?`,
    [
      event.baby_id,
      event.feeding_type,
      event.amount ?? null,
      event.unit ?? null,
      event.is_approximate ? 1 : 0,
      event.notes ?? null,
      event.timestamp,
      event.id,
    ],
  );
  return result.changes > 0;
}
