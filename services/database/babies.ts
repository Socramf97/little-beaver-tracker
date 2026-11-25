
import { getDatabase } from './database';
import { cleanupStoredPhotoFiles } from './photoStorage';

export interface Baby {
  id: string;
  name: string;
  birth_date: string | null;
  created_at: string;
}

export interface NewBaby {
  id: string;
  name: string;
  birth_date?: string | null;
}

export async function createBaby(baby: NewBaby): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO babies (id, name, birth_date, created_at)
     VALUES (?, ?, ?, ?)`,
    [
      baby.id,
      baby.name,
      baby.birth_date ?? null,
      new Date().toISOString(),
    ]
  );
}

export async function getBabyById(
  id: string
): Promise<Baby | null> {
  const db = await getDatabase();

  return db.getFirstAsync<Baby>(
    'SELECT * FROM babies WHERE id = ?',
    [id]
  );
}

export async function getAllBabies(): Promise<Baby[]> {
  const db = await getDatabase();

  return db.getAllAsync<Baby>(
    'SELECT * FROM babies ORDER BY created_at DESC'
  );
}

export async function updateBaby(
  id: string,
  name: string,
  birthDate: string | null
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE babies
     SET name = ?,
         birth_date = ?
     WHERE id = ?`,
    [
      name,
      birthDate,
      id
    ]
  );
}


/**
 * Deletes a baby and all related database records atomically.
 * Associated photo files are removed only after the
 * database transaction commits successfully.
 */
export async function deleteBaby(id: string): Promise<void> {
  if (!id.trim()) {
    throw new Error("A baby ID is required.");
  }

  const db = await getDatabase();
  let photoFiles: string[] = [];

  await db.withExclusiveTransactionAsync(async (tx) => {
    // Collect photo filenames before deleting their records.
    const photos = await tx.getAllAsync<{ file_uri: string }>(
      "SELECT file_uri FROM photo_attachments WHERE baby_id = ?",
      [id],
    );

    // Delete all records associated with this baby.
    await tx.runAsync(
      "DELETE FROM photo_attachments WHERE baby_id = ?",
      [id],
    );

    await tx.runAsync(
      "DELETE FROM feeding_events WHERE baby_id = ?",
      [id],
    );

    await tx.runAsync(
      "DELETE FROM diaper_events WHERE baby_id = ?",
      [id],
    );

    await tx.runAsync(
      "DELETE FROM measurements WHERE baby_id = ?",
      [id],
    );

    await tx.runAsync(
      "DELETE FROM babies WHERE id = ?",
      [id],
    );

    photoFiles = photos.map((photo) => photo.file_uri);
  });

  // Runs only after a successful database transaction.
  cleanupStoredPhotoFiles(photoFiles);
}
