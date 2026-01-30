// backend/src/database/migrations/002_create_trips_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('trips', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.integer('userId').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('title', 200).notNullable();
    table.text('description');
    table.date('startDate').notNullable();
    table.date('endDate').notNullable();
    table.enum('status', ['planning', 'active', 'completed', 'cancelled']).defaultTo('planning');
    table.boolean('isPublic').defaultTo(false);
    table.string('coverImageUrl', 500);
    table.json('tags'); // Array of tags as JSON
    table.float('totalDistance'); // Total distance in km
    table.integer('totalCost'); // Total cost in cents/base monetary
    table.string('currency', 3).defaultTo('USD'); // ISO 4217 currency code

    table.timestamps(true, true);

    // Índices
    table.index(['userId']);
    table.index(['status']);
    table.index(['startDate']);
    table.index(['endDate']);
    table.index(['isPublic']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('trips');
}