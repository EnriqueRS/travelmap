import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // users
  await knex.schema.alterTable('users', (table) => {
    table.renameColumn('passwordHash', 'password_hash');
    table.renameColumn('firstName', 'first_name');
    table.renameColumn('lastName', 'last_name');
    table.renameColumn('avatarUrl', 'avatar_url');
    table.renameColumn('isPublic', 'is_public');
    table.renameColumn('themePreference', 'theme_preference');
    table.renameColumn('homeLocationLat', 'home_location_lat');
    table.renameColumn('homeLocationLng', 'home_location_lng');
  });

  // trips
  await knex.schema.alterTable('trips', (table) => {
    table.renameColumn('userId', 'user_id');
    table.renameColumn('startDate', 'start_date');
    table.renameColumn('endDate', 'end_date');
    table.renameColumn('isPublic', 'is_public');
    table.renameColumn('coverImage', 'cover_image');
    table.renameColumn('totalDistance', 'total_distance');
    table.renameColumn('totalCost', 'total_cost');
    table.renameColumn('linkedAlbumId', 'linked_album_id');
    table.renameColumn('linkedAlbumProvider', 'linked_album_provider');
  });

  // locations
  await knex.schema.alterTable('locations', (table) => {
    table.renameColumn('tripId', 'trip_id');
    table.renameColumn('userId', 'user_id');
    table.renameColumn('countryId', 'country_id');
    table.renameColumn('visitDate', 'visit_date');
  });

  // photos
  await knex.schema.alterTable('photos', (table) => {
    table.renameColumn('userId', 'user_id');
    table.renameColumn('locationId', 'location_id');
    table.renameColumn('tripId', 'trip_id');
    table.renameColumn('showOnMap', 'show_on_map');
    table.renameColumn('isCover', 'is_cover');
    table.renameColumn('externalId', 'external_id');
  });

  // user_integrations
  await knex.schema.alterTable('user_integrations', (table) => {
    table.renameColumn('userId', 'user_id');
  });

  // user_country_statuses
  await knex.schema.alterTable('user_country_statuses', (table) => {
    table.renameColumn('userId', 'user_id');
    table.renameColumn('countryId', 'country_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  // user_country_statuses
  await knex.schema.alterTable('user_country_statuses', (table) => {
    table.renameColumn('user_id', 'userId');
    table.renameColumn('country_id', 'countryId');
  });

  // user_integrations
  await knex.schema.alterTable('user_integrations', (table) => {
    table.renameColumn('user_id', 'userId');
  });

  // photos
  await knex.schema.alterTable('photos', (table) => {
    table.renameColumn('user_id', 'userId');
    table.renameColumn('location_id', 'locationId');
    table.renameColumn('trip_id', 'tripId');
    table.renameColumn('show_on_map', 'showOnMap');
    table.renameColumn('is_cover', 'isCover');
    table.renameColumn('external_id', 'externalId');
  });

  // locations
  await knex.schema.alterTable('locations', (table) => {
    table.renameColumn('trip_id', 'tripId');
    table.renameColumn('user_id', 'userId');
    table.renameColumn('country_id', 'countryId');
    table.renameColumn('visit_date', 'visitDate');
  });

  // trips
  await knex.schema.alterTable('trips', (table) => {
    table.renameColumn('user_id', 'userId');
    table.renameColumn('start_date', 'startDate');
    table.renameColumn('end_date', 'endDate');
    table.renameColumn('is_public', 'isPublic');
    table.renameColumn('cover_image', 'coverImage');
    table.renameColumn('total_distance', 'totalDistance');
    table.renameColumn('total_cost', 'totalCost');
    table.renameColumn('linked_album_id', 'linkedAlbumId');
    table.renameColumn('linked_album_provider', 'linkedAlbumProvider');
  });

  // users
  await knex.schema.alterTable('users', (table) => {
    table.renameColumn('password_hash', 'passwordHash');
    table.renameColumn('first_name', 'firstName');
    table.renameColumn('last_name', 'lastName');
    table.renameColumn('avatar_url', 'avatarUrl');
    table.renameColumn('is_public', 'isPublic');
    table.renameColumn('theme_preference', 'themePreference');
    table.renameColumn('home_location_lat', 'homeLocationLat');
    table.renameColumn('home_location_lng', 'homeLocationLng');
  });
}
