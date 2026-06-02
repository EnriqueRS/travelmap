// Production knexfile - plain JS for CLI usage
module.exports = {
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'travelmap',
      password: process.env.DB_PASSWORD || 'travelmap_secret',
      database: process.env.DB_NAME || 'travelmap',
    },
    pool: { min: 2, max: 20 },
    migrations: {
      directory: './dist/database/migrations',
      tableName: 'knex_migrations',
      loadExtensions: ['.js'],
    },
    seeds: {
      directory: './dist/database/seeds',
      loadExtensions: ['.js'],
    },
  },
};
