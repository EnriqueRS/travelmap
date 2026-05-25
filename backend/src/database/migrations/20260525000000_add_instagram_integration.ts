import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Extend provider check constraint on user_integrations to include 'instagram'
  await knex.raw(`ALTER TABLE user_integrations DROP CONSTRAINT IF EXISTS "user_integrations_provider_check"`);
  await knex.raw(`ALTER TABLE user_integrations ADD CONSTRAINT "user_integrations_provider_check" CHECK (provider IN ('immich', 'instagram'))`);

  // Add columns needed for OAuth-based integrations (Instagram)
  await knex.schema.alterTable('user_integrations', (table) => {
    table.string('refresh_token', 1000).nullable();
    table.string('provider_user_id', 255).nullable();
    table.timestamp('token_expires_at').nullable();
  });

  // Extend provider check constraint on photos to include 'instagram'
  await knex.raw(`ALTER TABLE photos DROP CONSTRAINT IF EXISTS "photos_provider_check"`);
  await knex.raw(`ALTER TABLE photos ADD CONSTRAINT "photos_provider_check" CHECK (provider IN ('local', 'immich', 'instagram'))`);

  // Extend linkedAlbumProvider check constraint on trips to include 'instagram'
  await knex.raw(`ALTER TABLE trips DROP CONSTRAINT IF EXISTS "trips_linkedalbumprovider_check"`);
  await knex.raw(`ALTER TABLE trips ADD CONSTRAINT "trips_linkedalbumprovider_check" CHECK ("linkedAlbumProvider" IN ('immich', 'instagram'))`);
}

export async function down(knex: Knex): Promise<void> {
  // Remove Instagram-specific columns
  await knex.schema.alterTable('user_integrations', (table) => {
    table.dropColumn('refresh_token');
    table.dropColumn('provider_user_id');
    table.dropColumn('token_expires_at');
  });

  // Revert provider constraints to original values
  await knex.raw(`ALTER TABLE user_integrations DROP CONSTRAINT IF EXISTS "user_integrations_provider_check"`);
  await knex.raw(`ALTER TABLE user_integrations ADD CONSTRAINT "user_integrations_provider_check" CHECK (provider IN ('immich'))`);

  await knex.raw(`ALTER TABLE photos DROP CONSTRAINT IF EXISTS "photos_provider_check"`);
  await knex.raw(`ALTER TABLE photos ADD CONSTRAINT "photos_provider_check" CHECK (provider IN ('local', 'immich'))`);

  await knex.raw(`ALTER TABLE trips DROP CONSTRAINT IF EXISTS "trips_linkedalbumprovider_check"`);
  await knex.raw(`ALTER TABLE trips ADD CONSTRAINT "trips_linkedalbumprovider_check" CHECK ("linkedAlbumProvider" IN ('immich'))`);
}
