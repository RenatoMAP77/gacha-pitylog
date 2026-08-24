import { and, eq, isNull } from 'drizzle-orm';

import { newId, nowIso } from '@/lib/id';

import type { Database } from '../db/client';
import { banners } from '../db/schema';

export async function getActiveBanner(db: Database, bannerTypeId: string) {
  const [banner] = await db
    .select()
    .from(banners)
    .where(and(eq(banners.bannerTypeId, bannerTypeId), eq(banners.ativo, true), isNull(banners.deletedAt)))
    .limit(1);
  return banner ?? null;
}

/**
 * Cria um novo banner e o torna o ativo do seu tipo, desativando o anterior.
 * O pity continua carregando normalmente: a query de pity soma por banner_type_id,
 * não por banner_id (ver src/domain/pity.ts).
 */
export async function criarBannerEAtivar(
  db: Database,
  params: { bannerTypeId: string; nome: string; apelido?: string | null; dataInicio?: string | null }
) {
  await db
    .update(banners)
    .set({ ativo: false, updatedAt: nowIso() })
    .where(and(eq(banners.bannerTypeId, params.bannerTypeId), eq(banners.ativo, true)));

  const id = newId();
  await db.insert(banners).values({
    id,
    bannerTypeId: params.bannerTypeId,
    nome: params.nome,
    apelido: params.apelido ?? null,
    dataInicio: params.dataInicio ?? null,
    ativo: true,
    updatedAt: nowIso(),
  });
  return id;
}

export async function ativarBanner(db: Database, bannerId: string, bannerTypeId: string) {
  await db
    .update(banners)
    .set({ ativo: false, updatedAt: nowIso() })
    .where(and(eq(banners.bannerTypeId, bannerTypeId), eq(banners.ativo, true)));

  await db.update(banners).set({ ativo: true, updatedAt: nowIso() }).where(eq(banners.id, bannerId));
}

export async function listarBannersDoTipo(db: Database, bannerTypeId: string) {
  return db
    .select()
    .from(banners)
    .where(and(eq(banners.bannerTypeId, bannerTypeId), isNull(banners.deletedAt)));
}
