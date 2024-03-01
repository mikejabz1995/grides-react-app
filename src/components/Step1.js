import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import DatePicker from 'react-datepicker';
import './App.css';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment-timezone';
import './Step1.css';

const Step1 = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(localStorage.getItem('selectedAddress') || '');
  const [returnLocation, setReturnLocation] = useState('');
  const [pickupDateTime, setPickupDateTime] = useState(new Date());
  const [returnDateTime, setReturnDateTime] = useState(null);
  const [deliverToMe, setDeliverToMe] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const history = useHistory();
  const [userTimeZone, setUserTimeZone] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minReturnDateTime, setMinReturnDateTime] = useState();
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenResponse = await axios.post('https://calm-retreat-90846-cd036e8a822e.herokuapp.com/https://api.rentsyst.com/oauth2/token', {
          client_id: '3vN90WwtPO_FpaJXpC4YlG5IWdJE4GZG',
          client_secret: 'Jfjrmns8K25aDY_zQdz9Q6KolwgITUxp',
          grant_type: 'client_credentials'
        });
        const token = tokenResponse.data.access_token;
        localStorage.setItem('token', token);

        console.log('Token:', token); // Log the token to verify

        const locationsResponse = await axios.get('https://calm-retreat-90846-cd036e8a822e.herokuapp.com/https://api.rentsyst.com/v2/company/settings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Locations Response:', locationsResponse); // Log the response to verify

        const data = locationsResponse.data.locations;
        setLocations(data);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (pickupDateTime) {
      // Calculate the minimum return date/time as 48 hours after the pickup date/time
      const minReturnDate = new Date(pickupDateTime.getTime() + 48 * 60 * 60 * 1000);
      setMinReturnDateTime(minReturnDate);

      // If the currently selected return date/time is less than 48 hours after the pickup,
      // reset the return date/time to enforce the 48-hour rule
      if (returnDateTime && returnDateTime < minReturnDate) {
        setReturnDateTime(minReturnDate);
      }
    }
  }, [pickupDateTime, returnDateTime]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pickupLocation') {
      setPickupLocation(value);
    } else if (name === 'returnLocation') {
      setReturnLocation(value);
    } else if (name === 'dateFrom') {
      setDateFrom(value);
    } else if (name === 'dateTo') {
      setDateTo(value);
    }
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    console.log('Selected location value:', value);

    setSelectedLocation(value);

    console.log('Current locations array:', locations); // Log the locations array for inspection

    if (value === 'deliver_to_me') {
      console.log('Deliver to me selected');
      setDeliverToMe(true);
    } else {
      const selectedLocationObj = locations.find(location => location.id.toString() === value);
      console.log('Selected location object:', selectedLocationObj); // Check what the find method returns

      if (selectedLocationObj) {
        const locationName = selectedLocationObj.name;
        console.log('Selected location name:', locationName);

        setPickupLocation(locationName);
        setReturnLocation(locationName);

        // Store the location ID for API calls
        localStorage.setItem('PickupLocationURL', selectedLocationObj.id.toString());
        localStorage.setItem('ReturnLocationURL', selectedLocationObj.id.toString());

        try {
          localStorage.setItem('pickupLocation', locationName);
          localStorage.setItem('returnLocation', locationName);
          console.log('Locations stored in localStorage');
        } catch (error) {
          console.error('Error setting locations in localStorage:', error);
        }
      } else {
        console.log('No matching location found for the selected value');
      }
      setDeliverToMe(false);
      setStep(2);
    }
  };

  const handleSelect = async (value) => {
    setSelectedLocation('deliver_to_me');
    try {
      const results = await geocodeByAddress(value);
      const latLng = await getLatLng(results[0]);
      setCustomAddress(value); // Update the custom address with the selected Google Maps address
      localStorage.setItem('selectedAddress', value); // Store the selected address in local storage
      localStorage.setItem('CustomAddressURL', value); // Store the Google Maps address for API call
    } catch (error) {
      console.error('Error selecting address:', error);
      setError(error.message);
    }
    setAddress(value); // Update local state
    localStorage.setItem('selectedAddress', value); // Update local storage
    // Optionally, handle geocode results

  };

  const handlePickupChange = (date) => {
    // Ensure the pickup date is not in the past
    const currentDate = new Date();
    const selectedDate = new Date(date);

    if (currentDate.getTime() < selectedDate.getTime()) {
      const utcDate = moment.utc(date).format();
      const localDate = moment.utc(utcDate).local().toDate();
      setPickupDateTime(localDate);
      // Format and save the pickup date/time to localStorage in the specified format
      localStorage.setItem('DateFromURL', moment(localDate).format("YYYY-MM-DD HH:mm:ss"));
    }
  };

  const handleReturnChange = (date) => {
    if (!pickupDateTime) {
      return;
    }
    const selectedDate = new Date(date);
    if (pickupDateTime.getTime() < selectedDate.getTime()) {
      const utcDate = moment.utc(date).format();
      const localDate = moment.utc(utcDate).local().toDate();
      setReturnDateTime(localDate);
      // Format and save the return date/time to localStorage in the specified format
      localStorage.setItem('DateToURL', moment(localDate).format("YYYY-MM-DD HH:mm:ss"));
      // Do not automatically navigate to Step2.js
    }
  };

  const navigateToStep2 = () => {
    history.push('/step2');
  };

  const handleSubmitCustomAddress = () => {
    const selectedLocationName = customAddress;
    localStorage.setItem('selectedLocationName', selectedLocationName);
    localStorage.setItem('pickupLocation', selectedLocationName); // Store pickupLocation in local storage
    localStorage.setItem('returnLocation', selectedLocationName); // Store returnLocation in local storage
    localStorage.setItem('CustomAddressURL', selectedLocationName); // Store the Google Maps address for API call
    setStep(2);
  };

  const handlePickupConfirmation = () => {
    setStep(3);
    const formattedFromDate = pickupDateTime.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    localStorage.setItem('dateFrom', formattedFromDate);
  };

  const handleReturnConfirmation = () => {
    setStep(4);
    const formattedToDate = returnDateTime.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    localStorage.setItem('dateTo', formattedToDate);
  };

  const handleViewVehicles = () => {
    history.push({
      pathname: '/step2',
      state: {
        pickupLocation, // Pass pickupLocation to Step2.js
        returnLocation, // Pass returnLocation to Step2.js
      },
    });
  };


  return (
    <div className="app">
      {loading && <LoadingScreen />}
      {!loading && (
        <>
          <img src="/logo.png" alt="G RIDES Logo" className="logo" style={{ position: 'absolute', top: '60px', left: '10px', marginTop: '0' }} />
          <div className="content-container">
            <h1>Your destination awaits…</h1>
            <div className="input-container">
              <div className="reservation-details">
              </div>
              {step === 1 && (
                <div className="step">
                  <label htmlFor="location">Location:</label>
                  <select id="location" value={selectedLocation} onChange={handleLocationChange} required>
                    <option value="">Select Location</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                    <option value="deliver_to_me">Deliver to me</option>
                  </select>
                  {deliverToMe && (
                    <div className="form-group">
                      <label htmlFor="customAddress">Enter Delivery Address (charges may apply):</label>
                      <div className="custom-address-input">
                        <PlacesAutocomplete
                          value={customAddress}
                          onChange={setCustomAddress}
                          onSelect={handleSelect}
                          searchOptions={{
                            types: ['address'],
                            apiKey: 'AIzaSyDBinmfAS11SOAd1qlLQWDSRAvMJWwKM98',
                            language: 'en',
                          }}
                        >
                          {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                            <div className="autocomplete-container">
                              <input
                                {...getInputProps({
                                  placeholder: 'Search for your address...',
                                  className: 'location-search-input',
                                })}
                              />
                              <div className="autocomplete-dropdown-container">
                                {loading && <div>Loading...</div>}
                                {suggestions.map((suggestion) => (
                                  <div
                                    {...getSuggestionItemProps(suggestion, {
                                      className: suggestion.active ? 'suggestion-item--active' : 'suggestion-item',
                                    })}
                                  >
                                    {suggestion.description}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </PlacesAutocomplete>
                        <button onClick={handleSubmitCustomAddress}>Submit Address</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {step === 2 && (
                <div className="step">
                  <label htmlFor="pickupDate">Pickup Date and Time:</label>
                  <div className="date-time-picker-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <DatePicker
                      id="pickupDate"
                      selected={pickupDateTime}
                      onChange={handlePickupChange}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy hh:mm aa"
                      required
                      calendarClassName="custom-calendar"
                      filterTime={time => {
                        const currentDate = new Date();
                        const oneHourForward = new Date(currentDate.getTime() + 60 * 60 * 1000);
                        return new Date(time) > oneHourForward;
                      }}
                    />
                    <button className="confirm-button" onClick={handlePickupConfirmation} style={{ width: 'auto', padding: '10px 20px' }}>Confirm</button>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="step">
                  <label htmlFor="returnDate">Return Date and Time:</label>
                  <div className="date-time-picker-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <DatePicker
                      id="returnDate"
                      selected={returnDateTime}
                      onChange={handleReturnChange}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy hh:mm aa"
                      required
                      calendarClassName="custom-calendar"
                      minDate={minReturnDateTime}
                    />
                    <button className="confirm-button" onClick={handleReturnConfirmation} style={{ width: 'auto', padding: '10px 20px' }}>Confirm</button>
                  </div>
                  <div style={{ color: 'white', fontSize: '16px', marginTop: '10px' }}>*Please enter Return Time</div>
                </div>
              )}
              {step === 4 && (
                <div className="step">
                  <button className="submit-button" onClick={handleViewVehicles}>View Vehicles</button>
                </div>
              )}
              {error && <div className="error-message">{error}</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const LoadingScreen = () => (
  <div className="loading-screen">
    <img src="/logo.png" alt="G RIDES Logo" className="logo" />
    <div className="loading-bar-container">
      <div className="loading-bar" style={{ width: `90%` }}></div>
    </div>
  </div>
);

export default Step1;

