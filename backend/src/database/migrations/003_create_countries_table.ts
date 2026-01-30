// backend/src/database/migrations/003_create_countries_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Verify if PostGIS is available
  const postgisCheck = await knex.raw(`
    SELECT 1 FROM pg_available_extensions 
    WHERE name = 'postgis' AND installed_version IS NOT NULL
  `);

  const hasPostGIS = postgisCheck.rows.length > 0;

  await knex.schema.createTable('countries', (table) => {
    table.increments('id').primary();
    table.string('iso_alpha2', 2).unique().notNullable(); // US, MX, ES
    table.string('iso_alpha3', 3).unique().notNullable(); // USA, MEX, ESP
    table.string('name', 100).notNullable();
    table.string('continent', 50);
    table.string('capital', 100);
    table.bigInteger('population');
    table.float('area_sq_km');

    if (hasPostGIS) {
      // PostGIS columns if available
      table.specificType('geometry', 'geography(MULTIPOLYGON,4326)').notNullable();
      table.specificType('centroid', 'geography(POINT,4326)');
    } else {
      // Alternatives without PostGIS
      table.text('geometry_json'); // GeoJSON as text
      table.float('centroid_lat'); // Latitude of the centroid
      table.float('centroid_lng'); // Longitude of the centroid
    }

    table.timestamps(true, true);

    // Indexes
    table.index(['iso_alpha2']);
    table.index(['continent']);

    if (!hasPostGIS) {
      table.index(['centroid_lat', 'centroid_lng']);
    }
  });

  // Create spatial index only if PostGIS is available
  if (hasPostGIS) {
    await knex.raw('CREATE INDEX idx_countries_geometry ON countries USING GIST (geometry);');
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('countries');
}