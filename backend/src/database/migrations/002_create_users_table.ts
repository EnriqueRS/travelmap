// backend/src/database/migrations/002_create_users_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table: Knex.TableBuilder) => {
    table.increments('id').primary();
    table.string('username', 50).unique().notNullable();
    table.string('email', 255).unique().notNullable();
    table.string('passwordHash', 255).notNullable();
    table.string('firstName', 100);
    table.string('lastName', 100);
    table.string('avatarUrl', 500);
    table.text('bio');
    table.boolean('isPublic').defaultTo(false);
    table.enum('themePreference', ['light', 'dark', 'auto']).defaultTo('auto');
    table.timestamps(true, true);

    // Indexes
    table.index(['email']);
    table.index(['username']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
