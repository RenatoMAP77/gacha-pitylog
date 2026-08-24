const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Requerido pelo migrator do drizzle-orm/expo-sqlite, que importa os
// arquivos .sql das migrations diretamente (src/db/migrations/migrations.js).
config.resolver.sourceExts.push('sql');

// Requerido pelo expo-sqlite no target web (usa wa-sqlite compilado em wasm).
config.resolver.assetExts.push('wasm');

module.exports = config;
