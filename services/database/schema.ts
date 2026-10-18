
export const CREATE_TABLES_SQL = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS babies (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    birth_date TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feeding_events (
    id TEXT PRIMARY KEY NOT NULL,
    baby_id TEXT NOT NULL,
    feeding_type TEXT NOT NULL,
    amount REAL,
    unit TEXT,
    is_approximate INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (baby_id) REFERENCES babies(id)
  );

  CREATE TABLE IF NOT EXISTS diaper_events (
    id TEXT PRIMARY KEY NOT NULL,
    baby_id TEXT NOT NULL,
    diaper_type TEXT NOT NULL,
    notes TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (baby_id) REFERENCES babies(id)
  );

  CREATE TABLE IF NOT EXISTS measurements (
    id TEXT PRIMARY KEY NOT NULL,
    baby_id TEXT NOT NULL,
    weight_kg REAL,
    length_cm REAL,
    head_circumference_cm REAL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (baby_id) REFERENCES babies(id)
  );
`;
