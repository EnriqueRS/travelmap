import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Create table for user integrations (e.g: Immich credentials)
  await knex.schema.createTable('user_integrations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.integer('userId').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.enum('provider', ['immich']).notNullable();
    table.string('url', 1000); // API URL (required for immich)
    table.string('access_token', 1000); // API Key for Immich
    table.timestamps(true, true);

    // A user can only have one active configuration per provider
    table.unique(['userId', 'provider']);
  });

  // 2. Extend Trips table to include linked albums
  await knex.schema.alterTable('trips', (table) => {
    table.string('linkedAlbumId', 255);
    table.enum('linkedAlbumProvider', ['immich']);
  });

  // 3. Create Photos table to support interactive viewer properties
  await knex.schema.createTable('photos', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('url', 500).notNullable();
    table.string('caption', 1000);
    table.integer('userId').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('locationId').references('id').inTable('locations').onDelete('SET NULL');
    table.uuid('tripId').references('id').inTable('trips').onDelete('CASCADE');
    table.jsonb('metadata');

    // New properties
    table.enum('provider', ['local', 'immich']).defaultTo('local');
    table.string('externalId', 255);
    table.boolean('showOnMap').defaultTo(false);
    table.boolean('isCover').defaultTo(false);

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('photos');

  await knex.schema.alterTable('trips', (table) => {
    table.dropColumn('linkedAlbumId');
    table.dropColumn('linkedAlbumProvider');
  });

  await knex.schema.dropTable('user_integrations');
}
