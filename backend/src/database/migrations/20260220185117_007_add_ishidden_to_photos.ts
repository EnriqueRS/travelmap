import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('photos', (table) => {
    table.boolean('is_hidden').defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('photos', (table) => {
    table.dropColumn('is_hidden');
  });
}

