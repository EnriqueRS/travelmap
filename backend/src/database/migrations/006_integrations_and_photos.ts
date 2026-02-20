import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Crear tabla para integraciones de usuario (ej: credenciales de Immich)
  await knex.schema.createTable('user_integrations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.integer('userId').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.enum('provider', ['immich']).notNullable();
    table.string('url', 1000); // URL de la API (es requerida para immich)
    table.string('access_token', 1000); // API Key de Immich
    table.timestamps(true, true);

    // Un usuario solo puede tener una configuración activa por proveedor
    table.unique(['userId', 'provider']);
  });

  // 2. Extender tabla de Trips para incluir álbumes vinculados
  await knex.schema.alterTable('trips', (table) => {
    table.string('linkedAlbumId', 255);
    table.enum('linkedAlbumProvider', ['immich']);
  });

  // 3. Crear tabla de Photos para soportar propiedades del visor interactivo
  await knex.schema.createTable('photos', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('url', 500).notNullable();
    table.string('caption', 1000);
    table.integer('userId').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('locationId').references('id').inTable('locations').onDelete('SET NULL');
    table.uuid('tripId').references('id').inTable('trips').onDelete('CASCADE');
    table.jsonb('metadata');

    // Nuevas propiedades
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
