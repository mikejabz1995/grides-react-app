const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// API endpoint for authentication
app.post('/oauth2/token', async (req, res) => {
  try {
    // Authentication request to external API
    const tokenResponse = await axios.post('https://calm-retreat-90846-cd036e8a822e.herokuapp.com/api.rentsyst.com/auth2/token', {
      client_id: '3vN90WwtPO_FpaJXpC4YlG5IWdJE4GZG',
      client_secret: 'Jfjrmns8K25aDY_zQdz9Q6KolwgITUxp',
      grant_type: 'client_credentials'
    });

    // Respond with the token from the external API
    res.json(tokenResponse.data);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

// API endpoint for fetching company settings
app.get('/api/company/settings', async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization.split(' ')[1];
    
    // Fetch company settings using the token
    const companySettingsResponse = await axios.get('https://calm-retreat-90846-cd036e8a822e.herokuapp.com/api.rentsyst.com/v1/company/settings', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Respond with the company settings
    res.json(companySettingsResponse.data);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

// Serve static files from the build folder
app.use(express.static(path.resolve(__dirname, 'build')));

// Handle any other routes by serving the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
