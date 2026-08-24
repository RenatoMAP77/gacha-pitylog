import { and, eq } from 'drizzle-orm';

import { newId } from '@/lib/id';

import type { Database } from '../db/client';
import { characters } from '../db/schema';

export interface Personagem {
  id: string;
  gameId: string;
  nome: string;
  raridade: number;
  tipoItem: string;
  imageUrl: string | null;
}

export async function listarPersonagens(
  db: Database,
  filtro?: { gameId?: string; tipoItem?: 'character' | 'weapon' | 'lightcone' }
): Promise<Personagem[]> {
  const condicoes = [];
  if (filtro?.gameId) condicoes.push(eq(characters.gameId, filtro.gameId));
  if (filtro?.tipoItem) condicoes.push(eq(characters.tipoItem, filtro.tipoItem));

  const query = db.select().from(characters);
  if (condicoes.length === 0) return query;
  return query.where(and(...condicoes));
}

export async function criarPersonagem(
  db: Database,
  params: { gameId: string; nome: string; tipoItem: 'character' | 'weapon' | 'lightcone'; raridade: 4 | 5; imageUrl?: string | null }
) {
  const id = newId();
  await db.insert(characters).values({
    id,
    gameId: params.gameId,
    nome: params.nome.trim(),
    raridade: params.raridade,
    tipoItem: params.tipoItem,
    imageUrl: params.imageUrl || null,
  });
  return id;
}

export async function excluirPersonagem(db: Database, id: string) {
  await db.delete(characters).where(eq(characters.id, id));
}
