import { asc, eq, sql } from 'drizzle-orm';

import { newId } from '@/lib/id';

import type { Database } from '../db/client';
import { bannerTypes, games } from '../db/schema';

export interface GameComTipos {
  gameId: string;
  gameNome: string;
  tipos: { id: string; nome: string; tipo: string }[];
}

export async function getGamesComBannerTypes(db: Database): Promise<GameComTipos[]> {
  const jogos = await db.select().from(games).orderBy(asc(games.ordem));
  const tipos = await db.select().from(bannerTypes);

  return jogos.map((jogo) => ({
    gameId: jogo.id,
    gameNome: jogo.nome,
    tipos: tipos.filter((t) => t.gameId === jogo.id).map((t) => ({ id: t.id, nome: t.nome, tipo: t.tipo })),
  }));
}

export async function listarJogos(db: Database) {
  return db.select().from(games).orderBy(asc(games.ordem));
}

export async function criarJogo(db: Database, nome: string) {
  const slug = nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-');

  const [{ maxOrdem }] = await db.select({ maxOrdem: sql<number>`coalesce(max(${games.ordem}), -1)` }).from(games);

  const id = newId();
  await db.insert(games).values({ id, nome: nome.trim(), slug, ordem: maxOrdem + 1 });
  return id;
}

/** Move o jogo pra frente de todos os outros no dashboard (ex: "deixar HSR como principal"). */
export async function tornarJogoPrincipal(db: Database, gameId: string) {
  const [{ minOrdem }] = await db.select({ minOrdem: sql<number>`coalesce(min(${games.ordem}), 0)` }).from(games);
  await db.update(games).set({ ordem: minOrdem - 1 }).where(eq(games.id, gameId));
}

export async function getBannerTypesComJogo(db: Database) {
  const tipos = await db
    .select({
      id: bannerTypes.id,
      gameId: bannerTypes.gameId,
      nome: bannerTypes.nome,
      tipo: bannerTypes.tipo,
      hardPity: bannerTypes.hardPity,
      softPityRef: bannerTypes.softPityRef,
      gameNome: games.nome,
    })
    .from(bannerTypes)
    .innerJoin(games, eq(games.id, bannerTypes.gameId))
    .orderBy(asc(games.ordem));
  return tipos;
}

export async function atualizarSoftPityRef(db: Database, bannerTypeId: string, softPityRef: number) {
  await db.update(bannerTypes).set({ softPityRef }).where(eq(bannerTypes.id, bannerTypeId));
}

export async function criarBannerType(
  db: Database,
  params: { gameId: string; nome: string; tipo: 'character' | 'weapon' | 'standard'; hardPity: number; softPityRef: number }
) {
  const id = newId();
  await db.insert(bannerTypes).values({
    id,
    gameId: params.gameId,
    nome: params.nome.trim(),
    tipo: params.tipo,
    hardPity: params.hardPity,
    softPityRef: params.softPityRef,
  });
  return id;
}
