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
  const [minReturnDateTime, setMinReturnDateTime] = useState();
  const [dateFromURL, setDateFromURL] = useState(localStorage.getItem('DateFromURL') || '');

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

        const locationsResponse = await axios.get('https://calm-retreat-90846-cd036e8a822e.herokuapp.com/https://api.rentsyst.com/v2/company/settings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = locationsResponse.data.locations;
        setLocations(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setTimeout(() => {
          setLoading(false); // Turn off loading screen after 5 seconds
        }, 5000); // 5000 milliseconds = 5 seconds
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    localStorage.clear();
  }, []);

  useEffect(() => {
    if (dateFromURL && returnDateTime) {
      const from = moment(dateFromURL, "YYYY-MM-DD HH:mm:ss");
      const to = moment(returnDateTime, "YYYY-MM-DD HH:mm:ss");

      if (from.isValid() && to.isValid()) {
        const durationDays = to.diff(from, 'days') + 1;
        localStorage.setItem('ReservationDuration', durationDays.toString());
      }
    }
  }, [dateFromURL, returnDateTime]);

  useEffect(() => {
    if (pickupDateTime) {
      const minReturnDate = new Date(pickupDateTime.getTime() + 48 * 60 * 60 * 1000);
      setMinReturnDateTime(minReturnDate);

      if (returnDateTime && returnDateTime < minReturnDate) {
        setReturnDateTime(minReturnDate);
      }
    }
  }, [pickupDateTime, returnDateTime]);

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setSelectedLocation(value);

    if (value === 'deliver_to_me') {
      setDeliverToMe(true);
    } else {
      const selectedLocationObj = locations.find(location => location.id.toString() === value);

      if (selectedLocationObj) {
        const locationName = selectedLocationObj.name;

        setPickupLocation(locationName);
        setReturnLocation(locationName);

        localStorage.setItem('PickupLocationURL', selectedLocationObj.id.toString());
        localStorage.setItem('ReturnLocationURL', selectedLocationObj.id.toString());

        try {
          localStorage.setItem('pickupLocation', locationName);
          localStorage.setItem('returnLocation', locationName);
        } catch (error) {
          console.error('Error setting locations in localStorage:', error);
        }
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
      setCustomAddress(value);
      localStorage.setItem('selectedAddress', value);
      localStorage.setItem('CustomAddressURL', value);
    } catch (error) {
      console.error('Error selecting address:', error);
      setError(error.message);
    }
  };

  const handlePickupChange = (date) => {
    const currentDate = new Date();
    const selectedDate = new Date(date);
  
    if (currentDate.getTime() < selectedDate.getTime()) {
      const utcDate = moment.utc(date).format();
      const localDate = moment.utc(utcDate).local().toDate();
      setPickupDateTime(localDate);
      const formattedDateTime = moment(localDate).format("YYYY-MM-DD HH:mm:ss");
      localStorage.setItem('datefromurl', formattedDateTime); // Set datefromurl in localStorage
      setDateFromURL(formattedDateTime);
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
      const formattedDateTime = moment(localDate).format("YYYY-MM-DD HH:mm:ss");
      localStorage.setItem('DateToURL', formattedDateTime); // Set DateToURL in localStorage
    }
  };

  const handlePickupConfirmation = () => {
    setStep(3);
    const formattedFromDate = pickupDateTime.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    localStorage.setItem('dateFrom', formattedFromDate);
  };

  const handleReturnConfirmation = () => {
    if (!returnDateTime) {
      return; // Prevent further execution if returnDateTime is null
    }
    setStep(4);
    const formattedToDate = returnDateTime.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    localStorage.setItem('dateTo', formattedToDate);
  };
  
  const handleViewVehicles = () => {
    history.push({
      pathname: '/step2',
      state: {
        pickupLocation,
        returnLocation,
        DateFromURL: localStorage.getItem('datefromurl'),
      },
    });
  };

  return (
    <div className="app">
      {loading && <LoadingScreen />}
      {!loading && error && (
        <div className="error-screen" style={{ background: 'black', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '72px', fontWeight: 'bold' }}>404</div>
          <div style={{ fontSize: '24px' }}>Oops! Something went wrong.</div>
        </div>
      )}
      {!loading && !error && (
        <>
          <img src="/logo.png" alt="G RIDES Logo" className="logo" style={{ position: 'absolute', top: '60px', left: '10px', marginTop: '0' }} />
          <div className="content-container">
            <h1>Your destination awaits…</h1>
            <div className="input-container">
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
