import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('trips', (table) => {
    table.json('provinces').defaultTo('[]');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('trips', (table) => {
    table.dropColumn('provinces');
  });
}
