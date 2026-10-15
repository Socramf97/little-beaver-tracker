
import { getDatabase } from './database';

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
