import { Knex } from 'knex';
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: '192.168.100.73',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'travelmap'
  }
});

async function run() {
  try {
    const res = await knex.raw('SELECT id FROM locations LIMIT 1');
    if (res.rows.length > 0) {
      const locationId = res.rows[0].id;
      console.log('Testing delete on location:', locationId);
      await knex('locations').where('id', locationId).del();
      console.log('Successfully deleted location natively');
    } else {
      console.log('No locations found to delete');
    }
  } catch(e) {
    console.error('DELETE ERROR NATIVELY:', e.message);
  }
  await knex.destroy();
}

run();
