const axios = require('axios');

async function run () {
  try {
    const uniqueEmail = `test_${Date.now()}@example.com`;
    let token = '';

    console.log('Registering user...');
    try {
      const regObj = await axios.post('http://localhost:3001/auth/register', {
        email: uniqueEmail,
        password: 'password123',
        name: 'Tester'
      });
      console.log('Registered successfully');

      const loginObj = await axios.post('http://localhost:3001/auth/login', {
        username: uniqueEmail,
        password: 'password123'
      });
      token = loginObj.data.access_token || loginObj.data.token;

    } catch (e) {
      console.log('Auth failing', e.response?.data);
      return;
    }

    // Create a trip
    const tripObj = await axios.post('http://localhost:3001/trips', {
      name: 'Test Trip2',
      status: 'Planificado',
      currency: 'EUR',
      isPublic: false
    }, { headers: { Authorization: `Bearer ${token}` } });
    const tripId = tripObj.data.id;

    // Create a location
    const locObj = await axios.post('http://localhost:3001/locations', {
      name: 'Test Loc2',
      latitude: 40,
      longitude: 40,
      category: 'city',
      tripId: tripId
    }, { headers: { Authorization: `Bearer ${token}` } });
    const locId = locObj.data.id;
    console.log('Created loc:', locId);

    // Attempt delete
    const delObj = await axios.delete(`http://localhost:3001/locations/${locId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Delete API Success:', delObj.data);

  } catch (e) {
    console.error('API Error Response:', e.response?.data || e.message);
  }
}

run();
