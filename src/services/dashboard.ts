import { and, asc, eq } from 'drizzle-orm';

import { calcularStatusPity, type StatusPity } from '@/domain/pity';

import type { Database } from '../db/client';
import { bannerTypes, characters, games } from '../db/schema';
import { getActiveBanner } from './banners';
import { getPullLogsComContextoDaConta } from './pullLogs';

export interface CardDashboard {
  gameId: string;
  gameNome: string;
  gameOrdem: number;
  bannerTypeId: string;
  bannerTypeNome: string;
  tipo: 'character' | 'weapon' | 'standard';
  hardPity: number;
  softPityRef: number;
  bannerAtivo: { id: string; nome: string; apelido: string | null } | null;
  status: StatusPity;
  /** Roster fixo de fotos, só preenchido para bannerTypes do tipo 'standard' (ver §7). */
  rosterFotos: { id: string; nome: string; imageUrl: string | null }[];
}

export async function getDashboardData(db: Database, accountId: string): Promise<CardDashboard[]> {
  const tipos = await db
    .select({
      bannerTypeId: bannerTypes.id,
      bannerTypeNome: bannerTypes.nome,
      tipo: bannerTypes.tipo,
      hardPity: bannerTypes.hardPity,
      softPityRef: bannerTypes.softPityRef,
      gameId: games.id,
      gameNome: games.nome,
      gameOrdem: games.ordem,
    })
    .from(bannerTypes)
    .innerJoin(games, eq(games.id, bannerTypes.gameId))
    .orderBy(asc(games.ordem), asc(bannerTypes.tipo));

  const logs = await getPullLogsComContextoDaConta(db, accountId);

  const cards: CardDashboard[] = [];
  for (const tipo of tipos) {
    const bannerAtivo = await getActiveBanner(db, tipo.bannerTypeId);
    const status = calcularStatusPity(logs, accountId, tipo.bannerTypeId, tipo.hardPity, tipo.softPityRef);

    let rosterFotos: CardDashboard['rosterFotos'] = [];
    if (tipo.tipo === 'standard') {
      const personagens = await db
        .select({ id: characters.id, nome: characters.nome, imageUrl: characters.imageUrl })
        .from(characters)
        .where(and(eq(characters.gameId, tipo.gameId), eq(characters.tipoItem, 'character')));
      rosterFotos = personagens;
    }

    cards.push({
      gameId: tipo.gameId,
      gameNome: tipo.gameNome,
      gameOrdem: tipo.gameOrdem,
      bannerTypeId: tipo.bannerTypeId,
      bannerTypeNome: tipo.bannerTypeNome,
      tipo: tipo.tipo as CardDashboard['tipo'],
      hardPity: tipo.hardPity,
      softPityRef: tipo.softPityRef,
      bannerAtivo: bannerAtivo ? { id: bannerAtivo.id, nome: bannerAtivo.nome, apelido: bannerAtivo.apelido } : null,
      status,
      rosterFotos,
    });
  }
  return cards;
}
