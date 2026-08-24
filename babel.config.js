module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Permite `import sql from './arquivo.sql'` no migrator do drizzle-orm/expo-sqlite.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
