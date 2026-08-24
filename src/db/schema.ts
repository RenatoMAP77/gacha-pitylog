import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
});

export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  slug: text('slug').notNull().unique(),
  ordem: integer('ordem').notNull().default(0), // menor aparece primeiro no dashboard
});

export const bannerTypes = sqliteTable('banner_types', {
  id: text('id').primaryKey(),
  gameId: text('game_id')
    .notNull()
    .references(() => games.id),
  nome: text('nome').notNull(),
  tipo: text('tipo').notNull(), // 'character' | 'weapon' | 'standard'
  hardPity: integer('hard_pity').notNull(),
  softPityRef: integer('soft_pity_ref').notNull(),
});

export const banners = sqliteTable('banners', {
  id: text('id').primaryKey(),
  bannerTypeId: text('banner_type_id')
    .notNull()
    .references(() => bannerTypes.id),
  nome: text('nome').notNull(),
  apelido: text('apelido'),
  dataInicio: text('data_inicio'),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  deletedAt: text('deleted_at'),
});

export const characters = sqliteTable('characters', {
  id: text('id').primaryKey(),
  gameId: text('game_id')
    .notNull()
    .references(() => games.id),
  externalId: text('external_id'),
  nome: text('nome').notNull(),
  raridade: integer('raridade').notNull(), // 4 | 5
  tipoItem: text('tipo_item').notNull(), // 'character' | 'weapon' | 'lightcone'
  imageUrl: text('image_url'),
  imageLocalPath: text('image_local_path'),
});

export const pullLogs = sqliteTable('pull_logs', {
  id: text('id').primaryKey(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  bannerId: text('banner_id')
    .notNull()
    .references(() => banners.id),
  data: text('data').notNull(), // ISO 8601
  tipoRegistro: text('tipo_registro').notNull().default('pull'), // 'pull' | 'ajuste'
  qtdTiros: integer('qtd_tiros').notNull(),
  veio5Estrela: integer('veio_5estrela', { mode: 'boolean' }).notNull().default(false),
  characterId: text('character_id').references(() => characters.id),
  perdeu5050: integer('perdeu_5050', { mode: 'boolean' }),
  obs: text('obs'),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  deletedAt: text('deleted_at'),
});
