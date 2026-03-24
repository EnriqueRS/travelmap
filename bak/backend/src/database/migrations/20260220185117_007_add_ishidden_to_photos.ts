import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('photos', (table) => {
    table.boolean('isHidden').defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('photos', (table) => {
    table.dropColumn('isHidden');
  });
}

