import { newId } from '@/lib/id';

import type { Database } from '../db/client';
import { accounts } from '../db/schema';

export async function listarContas(db: Database) {
  return db.select().from(accounts);
}

export async function criarConta(db: Database, nome: string) {
  const id = newId();
  await db.insert(accounts).values({ id, nome, isDefault: false });
  return id;
}
