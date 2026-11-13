
import { getDatabase } from "./database";

// Feeding totals are grouped by type and unit.
// This avoids combining ounces and milliliters.
export interface FeedingBreakdown {
  feeding_type: string;
  unit: string | null;
  count: number;
  total_amount: number | null;
}

export interface DiaperBreakdown {
  diaper_type: string;
  count: number;
}

export interface DailySummary {
  babyId: string;
  date: string;
  feedingCount: number;
  diaperCount: number;
  feedings: FeedingBreakdown[];
  diapers: DiaperBreakdown[];
}

/**
 * Returns feeding and diaper activity for one baby
 * on a specific UTC calendar day (YYYY-MM-DD).
 */
export async function getDailySummary(
  babyId: string,
  date: string,
): Promise<DailySummary> {
  // Validate the baby ID.
  if (!babyId.trim()) {
    throw new Error("A baby ID is required.");
  }

  // Validate the date format.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Date must be YYYY-MM-DD.");
  }

  const start = new Date(`${date}T00:00:00.000Z`);

  // Reject impossible dates such as February 30.
  if (
    !Number.isFinite(start.getTime()) ||
    start.toISOString().slice(0, 10) !== date
  ) {
    throw new Error("Date must be a valid calendar date.");
  }

  // Use an exclusive end date so fractional seconds
  // are handled correctly.
  const end = new Date(
    start.getTime() + 24 * 60 * 60 * 1000
  );

  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const db = await getDatabase();

  // Summarize feeding events by feeding type and unit.
  const feedings = await db.getAllAsync<FeedingBreakdown>(
    `SELECT feeding_type, unit,
            COUNT(*) AS count,
            SUM(amount) AS total_amount
     FROM feeding_events
     WHERE baby_id = ?
       AND timestamp >= ?
       AND timestamp < ?
     GROUP BY feeding_type, unit
     ORDER BY feeding_type, unit`,
    [babyId, startIso, endIso],
  );

  // Summarize diaper events by diaper type.
  const diapers = await db.getAllAsync<DiaperBreakdown>(
    `SELECT diaper_type,
            COUNT(*) AS count
     FROM diaper_events
     WHERE baby_id = ?
       AND timestamp >= ?
       AND timestamp < ?
     GROUP BY diaper_type
     ORDER BY diaper_type`,
    [babyId, startIso, endIso],
  );

  // Calculate the total number of recorded events.
  const feedingCount = feedings.reduce(
    (sum, row) => sum + row.count,
    0,
  );

  const diaperCount = diapers.reduce(
    (sum, row) => sum + row.count,
    0,
  );

  return {
    babyId,
    date,
    feedingCount,
    diaperCount,
    feedings,
    diapers,
  };
}
