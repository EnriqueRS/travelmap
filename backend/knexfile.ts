// backend/knexfile.ts
import type { Knex } from 'knex';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'travelmap_user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'travelmap',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    // Enable PostGIS support
    searchPath: ['public', 'postgis'],
  },

  staging: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    searchPath: ['public', 'postgis'],
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    searchPath: ['public', 'postgis'],
  },

  test: {
    client: 'pg',
    connection: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      user: process.env.TEST_DB_USER || 'travelmap_test_user',
      password: process.env.TEST_DB_PASSWORD || 'password',
      database: process.env.TEST_DB_NAME || 'travelmap_test',
    },
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_test_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    searchPath: ['public', 'postgis'],
  },
};

export default config;