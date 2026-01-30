// backend/src/database/migrations/004_create_locations_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Verify if PostGIS is available
  const postgisCheck = await knex.raw(`
    SELECT 1 FROM pg_available_extensions 
    WHERE name = 'postgis' AND installed_version IS NOT NULL
  `);

  const hasPostGIS = postgisCheck.rows.length > 0;

  await knex.schema.createTable('locations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tripId').references('id').inTable('trips').onDelete('CASCADE');
    table.integer('userId').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('name', 200).notNullable();
    table.text('description');

    if (hasPostGIS) {
      // PostGIS coordinates
      table.specificType('coordinates', 'geography(POINT,4326)').notNullable();
    } else {
      // Alternatives without PostGIS
      table.float('latitude').notNullable();
      table.float('longitude').notNullable();
    }

    table.integer('countryId').references('id').inTable('countries').onDelete('SET NULL');
    table.date('visitDate');
    table.integer('rating').checkBetween([1, 5]);
    table.enum('category', [
      'city', 'landmark', 'nature', 'restaurant',
      'accommodation', 'transport', 'activity',
      'shopping', 'nightlife', 'cultural'
    ]).defaultTo('city');
    table.float('elevation'); // meters above sea level
    table.string('timezone', 50); // timezone database

    table.timestamps(true, true);

    // Indexes
    table.index(['userId']);
    table.index(['tripId']);
    table.index(['countryId']);
    table.index(['category']);
    table.index(['rating']);

    if (!hasPostGIS) {
      table.index(['latitude', 'longitude']);
    }

    // Composite index for user searches
    table.index(['userId', 'visitDate']);
  });

  // Create spatial index only if PostGIS is available
  if (hasPostGIS) {
    await knex.raw('CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);');
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('locations');
}