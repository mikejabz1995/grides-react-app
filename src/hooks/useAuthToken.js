// src/hooks/useAuthToken.js
import { useState, useEffect } from 'react';
import { fetchAuthToken } from '../api'; // Adjust the path as necessary

const useAuthToken = (client_id, client_secret) => {
  const [authToken, setAuthToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await fetchAuthToken(client_id, client_secret);
        setAuthToken(token);
      } catch (error) {
        setError(error);
      }
    };

    getToken();
  }, [client_id, client_secret]); // Re-fetch the token if the client_id or client_secret changes

  return { authToken, error };
};

export default useAuthToken;
