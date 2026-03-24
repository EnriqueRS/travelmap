import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasPostGIS = await knex.raw("SELECT 1 FROM pg_available_extensions WHERE name = 'postgis' AND installed_version IS NOT NULL");

  await knex.schema.alterTable('users', (table) => {
    if (hasPostGIS.rows.length > 0) {
      table.specificType('homeLocation', 'geography(POINT,4326)');
    } else {
      table.float('homeLocationLat');
      table.float('homeLocationLng');
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasPostGIS = await knex.raw("SELECT 1 FROM pg_available_extensions WHERE name = 'postgis' AND installed_version IS NOT NULL");

  await knex.schema.alterTable('users', (table) => {
    if (hasPostGIS.rows.length > 0) {
      table.dropColumn('homeLocation');
    } else {
      table.dropColumn('homeLocationLat');
      table.dropColumn('homeLocationLng');
    }
  });
}
