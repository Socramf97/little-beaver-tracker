
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(
        'little-beaver-tracker.db'
      );

      await db.execAsync(CREATE_TABLES_SQL);

      return db;
    })().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}
