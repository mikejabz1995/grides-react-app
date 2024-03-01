// src/components/Router.js

import axios from 'axios';

const Rentsyst = axios.create({
  baseURL: 'https://api.rentsyst.com/',
});

// Function to fetch the auth token and get company settings
export const fetchAuthToken = async (client_id, client_secret) => {
  try {
    // Fetch auth token
    const authResponse = await Rentsyst.post('oauth2/token', {
      client_id,
      client_secret,
      grant_type: 'client_credentials',
    });
    const authToken = authResponse.data.access_token;

    // Fetch company settings using the auth token
    const settingsResponse = await Rentsyst.get('/v2/company/settings', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    // Return both auth token and company settings
    return { authToken, companySettings: settingsResponse.data };
  } catch (error) {
    console.error('Error fetching auth token or company settings:', error);
    throw error;
  }
};

const RouterComponent = () => {
  // Router component implementation...
};

export default RouterComponent;
