import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('locations', (table) => {
    table.string('admin_area_1', 100).nullable().index(); // Province/State
    table.string('admin_area_2', 100).nullable().index(); // County/Municipality
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('locations', (table) => {
    table.dropColumn('admin_area_1');
    table.dropColumn('admin_area_2');
  });
}
