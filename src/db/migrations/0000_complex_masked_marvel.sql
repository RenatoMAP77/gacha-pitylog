CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `banner_types` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`hard_pity` integer NOT NULL,
	`soft_pity_ref` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`banner_type_id` text NOT NULL,
	`nome` text NOT NULL,
	`apelido` text,
	`data_inicio` text,
	`ativo` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`banner_type_id`) REFERENCES `banner_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`external_id` text,
	`nome` text NOT NULL,
	`raridade` integer NOT NULL,
	`tipo_item` text NOT NULL,
	`image_url` text,
	`image_local_path` text,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `games_slug_unique` ON `games` (`slug`);--> statement-breakpoint
CREATE TABLE `pull_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`banner_id` text NOT NULL,
	`data` text NOT NULL,
	`tipo_registro` text DEFAULT 'pull' NOT NULL,
	`qtd_tiros` integer NOT NULL,
	`veio_5estrela` integer DEFAULT false NOT NULL,
	`character_id` text,
	`perdeu_5050` integer,
	`obs` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`banner_id`) REFERENCES `banners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE no action
);
