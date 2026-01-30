// backend/src/database/migrations/005_create_user_country_statuses_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_country_statuses', (table) => {
    table.increments('id').primary();
    table.integer('userId').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.integer('countryId').references('id').inTable('countries').onDelete('CASCADE').notNullable();
    table.enum('status', ['visited', 'planned', 'wishlist']).notNullable();
    table.date('visitDate');
    table.text('notes');
    table.timestamps(true, true);
    
    // Constraint único para evitar duplicados
    table.unique(['userId', 'countryId', 'status']);
    
    // Índices
    table.index(['userId', 'status']);
    table.index(['countryId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_country_statuses');
}