export type TipoRegistro = 'pull' | 'ajuste';

export type TipoBanner = 'character' | 'weapon' | 'standard';

export type TipoItem = 'character' | 'weapon' | 'lightcone';

export interface Account {
  id: string;
  nome: string;
  isDefault: boolean;
}

export interface Game {
  id: string;
  nome: string;
  slug: string;
}

export interface BannerType {
  id: string;
  gameId: string;
  nome: string;
  tipo: TipoBanner;
  hardPity: number;
  softPityRef: number;
}

export interface Banner {
  id: string;
  bannerTypeId: string;
  nome: string;
  apelido: string | null;
  dataInicio: string | null;
  ativo: boolean;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CharacterEntity {
  id: string;
  gameId: string;
  externalId: string | null;
  nome: string;
  raridade: 4 | 5;
  tipoItem: TipoItem;
  imageUrl: string | null;
  imageLocalPath: string | null;
}

export interface PullLog {
  id: string;
  accountId: string;
  bannerId: string;
  data: string; // ISO 8601
  tipoRegistro: TipoRegistro;
  qtdTiros: number; // pode ser negativo somente quando tipoRegistro === 'ajuste'
  veio5Estrela: boolean;
  characterId: string | null;
  perdeu5050: boolean | null;
  obs: string | null;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Formato "achatado" de pull_log usado pelo domínio de cálculo de pity:
 * já traz accountId e bannerTypeId (que na tabela real vêm via join com `banners`),
 * para que as funções puras não dependam de SQL/joins.
 */
export interface PullLogComContexto {
  id: string;
  accountId: string;
  bannerTypeId: string;
  data: string;
  tipoRegistro: TipoRegistro;
  qtdTiros: number;
  veio5Estrela: boolean;
  deletedAt: string | null;
}
