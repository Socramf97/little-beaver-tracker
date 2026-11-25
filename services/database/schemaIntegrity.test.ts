
import { CREATE_TABLES_SQL } from "./schema";

describe("SQLite data integrity constraints", () => {
  test.each([
    "babies",
    "feeding_events",
    "diaper_events",
    "measurements",
    "photo_attachments",
  ])("%s declares an ID primary key", (table) => {
    expect(CREATE_TABLES_SQL).toMatch(
      new RegExp(
        `CREATE TABLE IF NOT EXISTS ${table} \\([\\s\\S]*?id TEXT PRIMARY KEY NOT NULL`,
      ),
    );
  });

  test.each([
    "feeding_events",
    "diaper_events",
    "measurements",
    "photo_attachments",
  ])("%s declares a baby foreign key", (table) => {
    const match = CREATE_TABLES_SQL.match(
      new RegExp(
        `CREATE TABLE IF NOT EXISTS ${table} \\([\\s\\S]*?\\);`,
      ),
    );

    expect(match?.[0]).toContain(
      "FOREIGN KEY (baby_id) REFERENCES babies(id)",
    );
  });

  test("schema requests foreign-key enforcement", () => {
    expect(CREATE_TABLES_SQL).toContain(
      "PRAGMA foreign_keys = ON;",
    );
  });

  test("declares indexes for event history and photo lookups", () => {
    expect(CREATE_TABLES_SQL).toContain(
      "idx_photo_attachments_event",
    );
    expect(CREATE_TABLES_SQL).toContain(
      "idx_feedings_baby_timestamp",
    );
    expect(CREATE_TABLES_SQL).toContain(
      "idx_diapers_baby_timestamp",
    );
    expect(CREATE_TABLES_SQL).toContain(
      "idx_measurements_baby_timestamp",
    );
  });
});
