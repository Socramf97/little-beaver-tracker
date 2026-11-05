
import { getDatabase } from './database';

export interface DiaperEvent {
  id: string;
  baby_id: string;
  diaper_type: string;
  notes: string | null;
  timestamp: string;
}

export interface NewDiaperEvent {
  id: string;
  baby_id: string;
  diaper_type: string;
  notes?: string | null;
  timestamp?: string;
}

export async function createDiaperEvent(
  event: NewDiaperEvent
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO diaper_events
      (id, baby_id, diaper_type, notes, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [
      event.id,
      event.baby_id,
      event.diaper_type,
      event.notes ?? null,
      event.timestamp ?? new Date().toISOString(),
    ]
  );
}

export async function getDiaperEventsByBaby(
  babyId: string
): Promise<DiaperEvent[]> {
  const db = await getDatabase();

  return db.getAllAsync<DiaperEvent>(
    `SELECT * FROM diaper_events
     WHERE baby_id = ?
     ORDER BY timestamp DESC`,
    [babyId]
  );
}
