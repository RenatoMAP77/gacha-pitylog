import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const expoDb = openDatabaseSync('pity-tracker.db');

export const db = drizzle(expoDb, { schema });

export type Database = typeof db;
