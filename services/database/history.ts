
import { getDatabase } from './database';

export type HistoryEventType = 'feeding' | 'diaper';
export type HistoryFilter = HistoryEventType | 'all';

export interface HistoryEvent {
  id: string;
  baby_id: string;
  event_type: HistoryEventType;
  timestamp: string;
  notes: string | null;
  feeding_type: string | null;
  amount: number | null;
  unit: string | null;
  is_approximate: number | null;
  diaper_type: string | null;
}

export interface HistoryOptions {
  babyId: string;
  type?: HistoryFilter;
  startDate?: string;
  endDate?: string;
}

function validateOptions(options: HistoryOptions): void {
  if (!options.babyId.trim()) {
    throw new Error('A baby ID is required.');
  }

  if (
    options.type !== undefined &&
    !['all', 'feeding', 'diaper'].includes(options.type)
  ) {
    throw new Error('Invalid history event type.');
  }

  for (const date of [options.startDate, options.endDate]) {
    if (date !== undefined && (
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString() !== date
    )) {
      throw new Error('Dates must be valid ISO UTC timestamps.');
    }
  }

  if (
    options.startDate &&
    options.endDate &&
    options.startDate > options.endDate
  ) {
    throw new Error('Start date cannot be after end date.');
  }
}

export async function getEventHistory(
  options: HistoryOptions
): Promise<HistoryEvent[]> {
  validateOptions(options);

  const db = await getDatabase();
  const type = options.type ?? 'all';

  const queries: string[] = [];
  const params: string[] = [];

  if (type === 'all' || type === 'feeding') {
    queries.push(`
      SELECT
        id, baby_id, 'feeding' AS event_type,
        timestamp, notes, feeding_type, amount,
        unit, is_approximate,
        NULL AS diaper_type
      FROM feeding_events
      WHERE baby_id = ?
    `);
    params.push(options.babyId);
  }

  if (type === 'all' || type === 'diaper') {
    queries.push(`
      SELECT
        id, baby_id, 'diaper' AS event_type,
        timestamp, notes,
        NULL AS feeding_type,
        NULL AS amount,
        NULL AS unit,
        NULL AS is_approximate,
        diaper_type
      FROM diaper_events
      WHERE baby_id = ?
    `);
    params.push(options.babyId);
  }

  const conditions: string[] = [];

  if (options.startDate) {
    conditions.push('timestamp >= ?');
    params.push(options.startDate);
  }

  if (options.endDate) {
    conditions.push('timestamp <= ?');
    params.push(options.endDate);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const sql = `
    SELECT *
    FROM (${queries.join(' UNION ALL ')})
    ${whereClause}
    ORDER BY timestamp DESC, event_type ASC, id ASC
  `;

  return db.getAllAsync<HistoryEvent>(sql, params);
}
