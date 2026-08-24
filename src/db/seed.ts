import { and, eq } from 'drizzle-orm';

import { urlIconeGenshin, urlIconeHsr } from '@/config/imageSources';
import { newId } from '@/lib/id';

import type { Database } from './client';
import { accounts, banners, bannerTypes, characters, games } from './schema';

const GAME_HSR = 'hsr';
const GAME_GENSHIN = 'genshin';

interface SeedGame {
  slug: string;
  nome: string;
  ordem: number;
}

interface SeedBannerType {
  gameSlug: string;
  nome: string;
  tipo: 'character' | 'weapon' | 'standard';
  hardPity: number;
  softPityRef: number;
}

interface SeedCharacter {
  gameSlug: string;
  nome: string;
  externalId: string;
  imageUrl: string;
}

const SEED_GAMES: SeedGame[] = [
  { slug: GAME_HSR, nome: 'Honkai: Star Rail', ordem: 0 },
  { slug: GAME_GENSHIN, nome: 'Genshin Impact', ordem: 1 },
];

const SEED_BANNER_TYPES: SeedBannerType[] = [
  { gameSlug: GAME_GENSHIN, nome: 'Personagem', tipo: 'character', hardPity: 90, softPityRef: 74 },
  { gameSlug: GAME_GENSHIN, nome: 'Arma', tipo: 'weapon', hardPity: 80, softPityRef: 63 },
  { gameSlug: GAME_GENSHIN, nome: 'Lendário', tipo: 'standard', hardPity: 90, softPityRef: 74 },
  { gameSlug: GAME_HSR, nome: 'Personagem', tipo: 'character', hardPity: 90, softPityRef: 74 },
  { gameSlug: GAME_HSR, nome: 'Cone de Luz', tipo: 'weapon', hardPity: 80, softPityRef: 65 },
  { gameSlug: GAME_HSR, nome: 'Estelar (Lendário)', tipo: 'standard', hardPity: 90, softPityRef: 74 },
];

// Roster fixo do banner padrão de cada jogo — o "mochileiro" (§ conversa 2026-08-24).
// Genshin: Wanderlust Invocation. HSR: Stellar Warp. Ambos raramente ganham gente nova.
const SEED_CHARACTERS: SeedCharacter[] = [
  { gameSlug: GAME_GENSHIN, nome: 'Diluc', externalId: 'Diluc', imageUrl: urlIconeGenshin('Diluc') },
  { gameSlug: GAME_GENSHIN, nome: 'Jean', externalId: 'Qin', imageUrl: urlIconeGenshin('Qin') },
  { gameSlug: GAME_GENSHIN, nome: 'Qiqi', externalId: 'Qiqi', imageUrl: urlIconeGenshin('Qiqi') },
  { gameSlug: GAME_GENSHIN, nome: 'Keqing', externalId: 'Keqing', imageUrl: urlIconeGenshin('Keqing') },
  { gameSlug: GAME_GENSHIN, nome: 'Mona', externalId: 'Mona', imageUrl: urlIconeGenshin('Mona') },
  { gameSlug: GAME_GENSHIN, nome: 'Tighnari', externalId: 'Tighnari', imageUrl: urlIconeGenshin('Tighnari') },
  { gameSlug: GAME_GENSHIN, nome: 'Yumemizuki Mizuki', externalId: 'Mizuki', imageUrl: urlIconeGenshin('Mizuki') },
  { gameSlug: GAME_HSR, nome: 'Himeko', externalId: '1003', imageUrl: urlIconeHsr('1003') },
  { gameSlug: GAME_HSR, nome: 'Welt', externalId: '1004', imageUrl: urlIconeHsr('1004') },
  { gameSlug: GAME_HSR, nome: 'Bronya', externalId: '1101', imageUrl: urlIconeHsr('1101') },
  { gameSlug: GAME_HSR, nome: 'Gepard', externalId: '1104', imageUrl: urlIconeHsr('1104') },
  { gameSlug: GAME_HSR, nome: 'Clara', externalId: '1107', imageUrl: urlIconeHsr('1107') },
  { gameSlug: GAME_HSR, nome: 'Yanqing', externalId: '1209', imageUrl: urlIconeHsr('1209') },
  { gameSlug: GAME_HSR, nome: 'Bailu', externalId: '1211', imageUrl: urlIconeHsr('1211') },
];

/**
 * Idempotente por linha (não só por "já rodou uma vez"): pode ser chamado
 * em todo boot do app e só cria o que ainda não existe. Isso permite
 * atualizar o seed (novo personagem, novo banner_type) sem precisar
 * apagar o banco do usuário.
 */
export async function seedDatabase(db: Database): Promise<void> {
  const gameIdBySlug = new Map<string, string>();

  for (const g of SEED_GAMES) {
    const [existente] = await db.select().from(games).where(eq(games.slug, g.slug)).limit(1);
    if (existente) {
      gameIdBySlug.set(g.slug, existente.id);
      continue;
    }
    const id = newId();
    await db.insert(games).values({ id, nome: g.nome, slug: g.slug, ordem: g.ordem });
    gameIdBySlug.set(g.slug, id);
  }

  const bannerTypeIdByKey = new Map<string, string>(); // `${gameSlug}:${tipo}`
  for (const bt of SEED_BANNER_TYPES) {
    const gameId = gameIdBySlug.get(bt.gameSlug)!;
    const [existente] = await db
      .select()
      .from(bannerTypes)
      .where(and(eq(bannerTypes.gameId, gameId), eq(bannerTypes.tipo, bt.tipo)))
      .limit(1);
    const key = `${bt.gameSlug}:${bt.tipo}`;
    if (existente) {
      bannerTypeIdByKey.set(key, existente.id);
      continue;
    }
    const id = newId();
    await db.insert(bannerTypes).values({
      id,
      gameId,
      nome: bt.nome,
      tipo: bt.tipo,
      hardPity: bt.hardPity,
      softPityRef: bt.softPityRef,
    });
    bannerTypeIdByKey.set(key, id);
  }

  // Banner padrão ("mochileiro"): sempre existe, nunca precisa ser criado manualmente.
  for (const gameSlug of [GAME_GENSHIN, GAME_HSR]) {
    const bannerTypeId = bannerTypeIdByKey.get(`${gameSlug}:standard`)!;
    const [existente] = await db.select().from(banners).where(eq(banners.bannerTypeId, bannerTypeId)).limit(1);
    if (existente) continue;
    await db.insert(banners).values({
      id: newId(),
      bannerTypeId,
      nome: gameSlug === GAME_GENSHIN ? 'Wanderlust Invocation' : 'Stellar Warp',
      apelido: 'Mochileiro',
      ativo: true,
      updatedAt: new Date().toISOString(),
    });
  }

  for (const c of SEED_CHARACTERS) {
    const gameId = gameIdBySlug.get(c.gameSlug)!;
    const [existente] = await db
      .select()
      .from(characters)
      .where(and(eq(characters.gameId, gameId), eq(characters.nome, c.nome)))
      .limit(1);
    if (existente) continue;
    await db.insert(characters).values({
      id: newId(),
      gameId,
      externalId: c.externalId,
      nome: c.nome,
      raridade: 5,
      tipoItem: 'character',
      imageUrl: c.imageUrl,
    });
  }

  const [contaPadrao] = await db.select().from(accounts).where(eq(accounts.isDefault, true)).limit(1);
  if (!contaPadrao) {
    await db.insert(accounts).values({ id: newId(), nome: 'Principal', isDefault: true });
  }
}

export async function getDefaultAccountId(db: Database): Promise<string> {
  const [account] = await db.select().from(accounts).where(eq(accounts.isDefault, true)).limit(1);
  if (!account) throw new Error('Nenhuma conta padrão encontrada — rode o seed primeiro.');
  return account.id;
}
