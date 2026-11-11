import { getDatabase } from "./database";

export interface Measurement {
  id: string;
  baby_id: string;
  weight_kg: number | null;
  length_cm: number | null;
  head_circumference_cm: number | null;
  timestamp: string;
}

export interface NewMeasurement {
  id: string;
  baby_id: string;
  weight_kg?: number | null;
  length_cm?: number | null;
  head_circumference_cm?: number | null;
  timestamp?: string;
}

export async function createMeasurement(
  measurement: NewMeasurement,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO measurements
      (id, baby_id, weight_kg, length_cm, head_circumference_cm, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      measurement.id,
      measurement.baby_id,
      measurement.weight_kg ?? null,
      measurement.length_cm ?? null,
      measurement.head_circumference_cm ?? null,
      measurement.timestamp ?? new Date().toISOString(),
    ],
  );
}

export async function getMeasurementsByBaby(
  babyId: string,
): Promise<Measurement[]> {
  const db = await getDatabase();

  return db.getAllAsync<Measurement>(
    `SELECT * FROM measurements
     WHERE baby_id = ?
     ORDER BY timestamp DESC`,
    [babyId],
  );
}

export async function updateMeasurement(
  measurement: NewMeasurement & { timestamp: string },
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `UPDATE measurements
     SET baby_id = ?, weight_kg = ?, length_cm = ?,
       head_circumference_cm = ?, timestamp = ?
     WHERE id = ?`,
    [
      measurement.baby_id,
      measurement.weight_kg ?? null,
      measurement.length_cm ?? null,
      measurement.head_circumference_cm ?? null,
      measurement.timestamp,
      measurement.id,
    ],
  );
  return result.changes > 0; // False means no changes were made (entry might've been deleted)
}

export async function deleteMeasurement(id: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `DELETE FROM measurements
     WHERE id = ?`,
    [id],
  );
  return result.changes > 0; // False means nothing was deleted (no measurement with that id)
}
