import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import DatePicker from 'react-datepicker';
import './App.css';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment-timezone';
import './Step1.css';

const CustomModal = ({ isOpen, onClose, onGoBack }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <p>Sorry, we only allow delivery options for customers within 40 Mile Radius of our Headquarters</p>
        <button onClick={onGoBack}>Go Back</button>
      </div>
    </div>
  );
};

const Step1 = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true); // Assuming you have a loading state
  const [error, setError] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(localStorage.getItem('pickupLocation') || '');
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
  const [duration, setDuration] = useState(0);
  const [showCustomModal, setShowCustomModal] = useState(false);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };
  
  const toRadians = (degrees) => {
    return degrees * Math.PI / 180;
  };

const handleAddressValidation = async () => {
  const customAddressLat = parseFloat(localStorage.getItem('CustomAddressLat'));
  const customAddressLon = parseFloat(localStorage.getItem('CustomAddressLon'));
  const headquartersLat = 37.3334; // Latitude of headquarters
  const headquartersLon = -121.8843; // Longitude of headquarters

  // Perform address validation
  if (customAddressLat && customAddressLon) {
    // Calculate the distance between the custom address and headquarters
    const distance = calculateDistance(customAddressLat, customAddressLon, headquartersLat, headquartersLon);

    // Check if the distance is greater than 40 miles
    if (distance > 40) {
      setShowCustomModal(true);
      return;
    }
  }

  // Proceed with the entry if the address is within the 40-mile radius
};

useEffect(() => {
  handleAddressValidation();
}, [customAddress]); // Ensure dependencies are correctly listed

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
      setLoading(false); // Turn off loading screen after 3.5 seconds
    }, 3500); // 3500 milliseconds = 3.5 seconds
  }
};

useEffect(() => {
  localStorage.clear();
}, []);

useEffect(() => {
  if (dateFromURL && returnDateTime) {
    const from = moment(dateFromURL, "YYYY-MM-DD HH:mm:ss");
    const to = moment(returnDateTime, "YYYY-MM-DD HH:mm:ss");

    if (from.isValid() && to.isValid()) {
      const durationDays = to.diff(from, 'days') + 1;
      localStorage.setItem('Duration', durationDays.toString());
      setDuration(durationDays);
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

const handleAddressChange = (value) => {
  setCustomAddress(value);
  // This function only updates the address state, no validation or modal display here
};

const handleSelect = async (value) => {
  setSelectedLocation(value); // Set the selected location to the custom address value
  try {
    const results = await geocodeByAddress(value);
    const latLng = await getLatLng(results[0]);
    setCustomAddress(value);
    
    // Get the most accurate address from the results
    const addressComponents = results[0].address_components;
    let formattedAddress = '';
    addressComponents.forEach(component => {
      formattedAddress += component.long_name + ', ';
    });
    formattedAddress = formattedAddress.slice(0, -2); // Remove the last comma and space
    
    // Store the formatted address in local storage
    localStorage.setItem('pickupLocationURL', formattedAddress);
    localStorage.setItem('returnLocationURL', formattedAddress);
    
    // Store the latitude and longitude in local storage
    localStorage.setItem('CustomAddressLat', latLng.lat);
    localStorage.setItem('CustomAddressLon', latLng.lng);
    
    localStorage.setItem('selectedAddress', value);
    localStorage.setItem('CustomAddressURL', formattedAddress);
    setStep(2); // Proceed to the next step

    // Call the handleAddressValidation function
    handleAddressValidation();
  } catch (error) {
    console.error('Error selecting address:', error);
    setError(error.message);
  }
  return Promise.resolve(); // Return a promise that resolves immediately
};

useEffect(() => {
  fetchData();
}, []);

useEffect(() => {
  handleAddressValidation();
}, [customAddress]); // Ensure dependencies are correctly listed

const handlePickupChange = (date) => {
  const currentDate = new Date();
  const selectedDate = new Date(date);

  if (currentDate.getTime() < selectedDate.getTime()) {
    const utcDate = moment.utc(date).format();
    const localDate = moment.utc(utcDate).local().toDate();
    setPickupDateTime(localDate);
    const formattedDateTime = moment(localDate).format("YYYY-MM-DD HH:mm:ss");
    localStorage.setItem('dateFromURL', formattedDateTime); // Set datefromurl in localStorage
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
  if (!selectedLocation || !pickupDateTime) {
    return;
  }

  if (selectedLocation === 'deliver_to_me') {
    setStep(3);
    const formattedFromDate = pickupDateTime.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    localStorage.setItem('dateFrom', formattedFromDate);
  } else {
    const customAddressLat = parseFloat(localStorage.getItem('CustomAddressLat'));
    const customAddressLon = parseFloat(localStorage.getItem('CustomAddressLon'));
    const headquartersLat = 37.3334; // Latitude of headquarters
    const headquartersLon = -121.8843; // Longitude of headquarters

    // Perform address validation
    if (customAddressLat && customAddressLon) {
      // Calculate the distance between the custom address and headquarters
      const distance = calculateDistance(customAddressLat, customAddressLon, headquartersLat, headquartersLon);

      // Check if the distance is greater than 40 miles
      if (distance > 40) {
        alert("Sorry, we only allow delivery options for customers within 40 Mile Radius of our Headquarters");
        return;
      }
    }

    setStep(3);
    const formattedFromDate = pickupDateTime.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    localStorage.setItem('dateFrom', formattedFromDate);
  }
};

useEffect(() => {
  handlePickupConfirmation();
}, []);

const handleReturnConfirmation = () => {
  if (!returnDateTime) {
    return;
  }
  setStep(4);
  const formattedToDate = returnDateTime.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
  localStorage.setItem('dateTo', formattedToDate);
  const durationDays = Math.ceil((returnDateTime - pickupDateTime) / (1000 * 60 * 60 * 24));
  setDuration(durationDays);
  localStorage.setItem('Duration', durationDays.toString());
};

const handleViewVehicles = () => {
  history.push({
    pathname: '/step2',
    state: {
      pickupLocation,
      returnLocation,
      DateFromURL: localStorage.getItem('dateFromURL'),
    },
  });
};

return (
  <div className="app">
    {loading && (
      <div className="center-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <img src={process.env.PUBLIC_URL + '/logo.png'} alt="G RIDES Logo" className="center-logo" />
        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `90%` }}></div>
        </div>
      </div>
    )}
    {showCustomModal && (
      <CustomModal
      isOpen={showCustomModal}
      onClose={() => setShowCustomModal(false)}
      onGoBack={() => {
        setShowCustomModal(false);
        setStep(1); // Navigate back to the custom address selection step
        // Reset custom address selection
        localStorage.removeItem('CustomAddressLat');
        localStorage.removeItem('CustomAddressLon');
        localStorage.removeItem('selectedAddress');
        localStorage.removeItem('CustomAddressURL');
        setCustomAddress('');
        }}     
      />
    )}
    {!loading && error && (
      <div className="error-screen" style={{ background: 'black', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '72px', fontWeight: 'bold' }}>404</div>
        <div style={{ fontSize: '24px' }}>Oops! Something went wrong.</div>
      </div>
    )}
    {!loading && !error && !showCustomModal && (
      <>
        <img src={process.env.PUBLIC_URL + '/logo.png'} alt="G RIDES Logo" className="logo" style={{ position: 'absolute', top: '60px', left: '10px', marginTop: '0' }} />
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
  <label htmlFor="customAddress" className="custom-label" style={{ marginTop: '20px' }}>Enter Delivery Address (charges may apply):</label> 
 <PlacesAutocomplete
  value={customAddress}
  onChange={handleAddressChange}
  onSelect={handleSelect}
      searchOptions={{
        types: ['address'],
        apiKey: 'AIzaSyDdy3Eso4Fwgh70xcktF8HxUX8MM3ZdJE0', // Replace 'YOUR_API_KEY' with your actual API key
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

export default Step1;
