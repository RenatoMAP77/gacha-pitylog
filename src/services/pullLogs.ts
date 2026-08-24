import { and, desc, eq, isNull } from 'drizzle-orm';

import { calcularDeltaAjuste, calcularPityAtual } from '@/domain/pity';
import type { PullLogComContexto } from '@/domain/types';
import { newId, nowIso } from '@/lib/id';

import type { Database } from '../db/client';
import { banners, characters, pullLogs } from '../db/schema';

/**
 * Todos os pull_logs não deletados de uma conta, já achatados com o
 * banner_type_id (via join com banners) — formato que src/domain/pity.ts espera.
 */
export async function getPullLogsComContextoDaConta(
  db: Database,
  accountId: string
): Promise<PullLogComContexto[]> {
  const rows = await db
    .select({
      id: pullLogs.id,
      accountId: pullLogs.accountId,
      bannerTypeId: banners.bannerTypeId,
      data: pullLogs.data,
      tipoRegistro: pullLogs.tipoRegistro,
      qtdTiros: pullLogs.qtdTiros,
      veio5Estrela: pullLogs.veio5Estrela,
      deletedAt: pullLogs.deletedAt,
    })
    .from(pullLogs)
    .innerJoin(banners, eq(banners.id, pullLogs.bannerId))
    .where(and(eq(pullLogs.accountId, accountId), isNull(pullLogs.deletedAt)));

  return rows as PullLogComContexto[];
}

export async function registrarPull(
  db: Database,
  params: {
    accountId: string;
    bannerId: string;
    qtdTiros: number;
    veio5Estrela?: boolean;
    characterId?: string | null;
    perdeu5050?: boolean | null;
    obs?: string | null;
    data?: string;
  }
) {
  const id = newId();
  const timestamp = params.data ?? nowIso();
  await db.insert(pullLogs).values({
    id,
    accountId: params.accountId,
    bannerId: params.bannerId,
    data: timestamp,
    tipoRegistro: 'pull',
    qtdTiros: params.qtdTiros,
    veio5Estrela: params.veio5Estrela ?? false,
    characterId: params.characterId ?? null,
    perdeu5050: params.perdeu5050 ?? null,
    obs: params.obs ?? null,
    updatedAt: timestamp,
  });
  return id;
}

/**
 * Ajuste manual de pity (§5): recebe o pity real conferido no jogo, calcula
 * o delta a partir do pity atual derivado do histórico e grava um pull_log
 * com tipo_registro = 'ajuste'. qtd_tiros pode ser negativo.
 */
export async function registrarAjuste(
  db: Database,
  params: { accountId: string; bannerTypeId: string; bannerId: string; pityReal: number; obs?: string | null }
) {
  const logs = await getPullLogsComContextoDaConta(db, params.accountId);
  const pityAtual = calcularPityAtual(logs, params.accountId, params.bannerTypeId);
  const delta = calcularDeltaAjuste(pityAtual, params.pityReal);

  const id = newId();
  const timestamp = nowIso();
  await db.insert(pullLogs).values({
    id,
    accountId: params.accountId,
    bannerId: params.bannerId,
    data: timestamp,
    tipoRegistro: 'ajuste',
    qtdTiros: delta,
    veio5Estrela: false,
    obs: params.obs ?? 'ajuste manual',
    updatedAt: timestamp,
  });
  return { id, delta };
}

export async function listarHistoricoDaConta(db: Database, accountId: string) {
  return db
    .select({
      id: pullLogs.id,
      data: pullLogs.data,
      tipoRegistro: pullLogs.tipoRegistro,
      qtdTiros: pullLogs.qtdTiros,
      veio5Estrela: pullLogs.veio5Estrela,
      perdeu5050: pullLogs.perdeu5050,
      obs: pullLogs.obs,
      bannerId: pullLogs.bannerId,
      bannerNome: banners.nome,
      bannerApelido: banners.apelido,
      characterId: pullLogs.characterId,
      characterNome: characters.nome,
      characterImageUrl: characters.imageUrl,
    })
    .from(pullLogs)
    .innerJoin(banners, eq(banners.id, pullLogs.bannerId))
    .leftJoin(characters, eq(characters.id, pullLogs.characterId))
    .where(and(eq(pullLogs.accountId, accountId), isNull(pullLogs.deletedAt)))
    .orderBy(desc(pullLogs.data));
}

export async function excluirPullLog(db: Database, id: string) {
  await db.update(pullLogs).set({ deletedAt: nowIso(), updatedAt: nowIso() }).where(eq(pullLogs.id, id));
}

export async function editarPullLog(
  db: Database,
  id: string,
  patch: Partial<{ qtdTiros: number; obs: string | null; veio5Estrela: boolean; perdeu5050: boolean | null; data: string }>
) {
  await db
    .update(pullLogs)
    .set({ ...patch, updatedAt: nowIso() })
    .where(eq(pullLogs.id, id));
}

export async function getOuCriarCharacter(
  db: Database,
  params: { gameId: string; nome: string; tipoItem: 'character' | 'weapon' | 'lightcone'; raridade?: 4 | 5 }
) {
  const nomeNormalizado = params.nome.trim();
  const [existente] = await db
    .select()
    .from(characters)
    .where(and(eq(characters.gameId, params.gameId), eq(characters.nome, nomeNormalizado)))
    .limit(1);
  if (existente) return existente.id;

  const id = newId();
  await db.insert(characters).values({
    id,
    gameId: params.gameId,
    nome: nomeNormalizado,
    raridade: params.raridade ?? 5,
    tipoItem: params.tipoItem,
  });
  return id;
}
