// ../api/Rentsyst.js
import axios from 'axios';

const Rentsyst = axios.create({
  baseURL: 'https://api.rentsyst.com/',
});

export async function fetchAuthToken(clientId, clientSecret) {
  try {
    const response = await Rentsyst.post('oauth2/token', {
      client_id: '3vN90WwtPO_FpaJXpC4YlG5IWdJE4GZG',          // Replace this with your actual client ID
      client_secret: 'Jfjrmns8K25aDY_zQdz9Q6KolwgITUxp',  // Replace this with your actual client secret
      grant_type: 'client_credentials',
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    throw error;
  }
}

export async function getCompanySettings(authToken) {
  try {
    if (!authToken) {
      throw new Error('Authentication token is required.');
    }
    const response = await Rentsyst.get('/v1/company/settings', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    throw error;
  }
}
