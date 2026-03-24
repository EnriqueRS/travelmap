// backend/src/database/migrations/001_create_extensions.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create UUID extension (necessary for generating UUIDs)
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Verify if PostGIS is available before trying to create it
  const postgisCheck = await knex.raw(`
    SELECT 1 FROM pg_available_extensions 
    WHERE name = 'postgis' AND installed_version IS NOT NULL
  `);

  if (postgisCheck.rows.length > 0) {
    // PostGIS is available, create the extensions
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis"');
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis_topology"');
  } else {
    // PostGIS is not available, check if it can be installed
    const canInstall = await knex.raw(`
      SELECT 1 FROM pg_available_extensions 
      WHERE name = 'postgis'
    `);

    if (canInstall.rows.length > 0) {
      try {
        await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis"');
        await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis_topology"');
      } catch (error) {
        console.warn('PostGIS extension could not be installed. Geographic features will be limited.');
      }
    } else {
      console.warn('PostGIS is not available in this database. Geographic features will be limited.');
      console.warn('To enable PostGIS, use a PostGIS-enabled database image like postgis/postgis');
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop extensions (optional, generally not done)
  await knex.raw('DROP EXTENSION IF EXISTS "postgis_topology"');
  await knex.raw('DROP EXTENSION IF EXISTS "postgis"');
  await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
}