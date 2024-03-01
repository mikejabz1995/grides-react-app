import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import moment from 'moment';
import './Step2.css';
import OpenAI from "openai";

const localStorageKey = 'vehicleDescriptions';

function saveVehicleDescription(vehicleId, description, colorTitle) {
  const existingEntries = JSON.parse(localStorage.getItem(localStorageKey)) || {};
  existingEntries[vehicleId] = { description, colorTitle };
  localStorage.setItem(localStorageKey, JSON.stringify(existingEntries));
}

function getVehicleDescription(vehicleId) {
  const existingEntries = JSON.parse(localStorage.getItem(localStorageKey)) || {};
  return existingEntries[vehicleId];
}

const defaultFilters = {
  tripPrice: { min: 0, max: 1000 },
  vehicleType: 'All',
  fuelType: 'All',
  transmission: 'All',
  brandOrModel: '',
};

function safeDateFormat(dateInput) {
  if (!dateInput) {
    console.error('Date input is undefined, null, or empty');
    return 'Invalid Date';
  }
  const momentDate = moment(dateInput);
  if (!momentDate.isValid()) {
    console.error('Invalid date:', dateInput);
    return 'Invalid Date';
  }
  return momentDate.format('MMMM D, YYYY [at] hh:mm A');
}

function validateAndFormatDate(dateString) {
  if (!dateString) {
    return 'Invalid Date: No date string provided';
  }
  const date = moment(dateString, "YYYY-MM-DD HH:mm:ss");
  if (!date.isValid()) {
    return `Invalid Date: '${dateString}' is not a valid date.`;
  }
  return date.format('YYYY-MM-DD HH:mm:ss');
}

const Step2 = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const pickupLocation = localStorage.getItem('pickupLocation') || '';
  const finalReturnLocation = localStorage.getItem('finalReturnLocation') || '';
  const dateFrom = localStorage.getItem('DateFromURL') || '';
  const dateTo = localStorage.getItem('DateToURL') || '';
  const reservationDuration = (() => {
    const from = moment(dateFrom, "YYYY-MM-DD HH:mm:ss");
    const to = moment(dateTo, "YYYY-MM-DD HH:mm:ss");
    return to.diff(from, 'days') + 1; // +1 to round up to the nearest day
  })();

  useEffect(() => {
    const fetchVehiclesAndGenerateDescriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const vehicleData = await fetchVehicles(); // Ensure this function is correctly implemented
        const openai = new OpenAI({
          apiKey: process.env.REACT_APP_OPENAI_API_KEY
        });

        const vehiclesWithDescriptions = await Promise.all(vehicleData.map(async (vehicle) => {
          const storedDescription = getVehicleDescription(vehicle.id);
          if (storedDescription) {
            return { ...vehicle, ...storedDescription };
          }

          const descriptionPrompt = `Generate a unique short description for a vehicle with the following attributes: Year: ${vehicle.year}, Brand: ${vehicle.brand}, Model: ${vehicle.model}, Color: ${vehicle.color}.`;
          const descriptionResponse = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: descriptionPrompt,
            max_tokens: 60,
          });

          const colorPrompt = `Generate a descriptive color title for the color ${vehicle.color}.`;
          const colorResponse = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: colorPrompt,
            max_tokens: 10,
          });

          const description = descriptionResponse.data.choices[0].text.trim();
          const colorTitle = colorResponse.data.choices[0].text.trim();

          saveVehicleDescription(vehicle.id, description, colorTitle);

          return {
            ...vehicle,
            description,
            colorTitle,
          };
        }));

        setVehicles(vehiclesWithDescriptions);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
        setError('Failed to fetch available vehicles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehiclesAndGenerateDescriptions();
  }, []);

  useEffect(() => {
    localStorage.setItem('finalReturnLocation', finalReturnLocation);
    localStorage.setItem('DateFromURL', dateFrom);
    localStorage.setItem('DateToURL', dateTo);
  }, [finalReturnLocation, dateFrom, dateTo]);

  async function fetchVehicles() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token not found in localStorage");
      }

      const storedDateFrom = localStorage.getItem('DateFromURL');
      const storedDateTo = localStorage.getItem('DateToURL');
      if (!storedDateFrom || !storedDateTo) {
        throw new Error("Date range is incomplete. Please select both start and end dates.");
      }

      const formattedDateFrom = validateAndFormatDate(storedDateFrom);
      const formattedDateTo = validateAndFormatDate(storedDateTo);

      const pickupLocationURL = localStorage.getItem('PickupLocationURL');
      const returnLocationURL = localStorage.getItem('ReturnLocationURL');
      const customAddressURL = localStorage.getItem('CustomAddressURL');

      if (!customAddressURL && (!pickupLocationURL || !returnLocationURL)) {
        console.error("Location information is missing.");
        setError("Location information is missing. Please select both pickup and return locations.");
        setLoading(false);
        return;
      }

      let queryParams = new URLSearchParams({
        date_from: formattedDateFrom,
        date_to: formattedDateTo,
      });

      if (customAddressURL) {
        queryParams.set('pickup_location', customAddressURL);
        queryParams.set('return_location', customAddressURL);
      } else {
        queryParams.set('pickup_location', pickupLocationURL);
        queryParams.set('return_location', returnLocationURL);
      }

      const response = await axios.get(`https://calm-retreat-90846-cd036e8a822e.herokuapp.com/https://api.rentsyst.com/v2/booking/search?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const vehicleCatalog = response.data.vehicles.map(vehicle => ({
        id: vehicle.id,
        year: vehicle.year,
        number_seats: vehicle.specs?.number_seats,
        number_doors: vehicle.specs?.number_doors,
        large_bags: vehicle.specs?.large_bags,
        small_bags: vehicle.specs?.small_bags,
        odometer: vehicle.specs?.odometer,
        mark: vehicle.mark,
        group: vehicle.group,
      }));

      return vehicleCatalog; // Corrected return statement
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      setError("Failed to fetch vehicles. Please try again later.");
      setLoading(false);
      return []; // Return an empty array in case of error
    }
  }

  return (
    <div>
      <div className="top-bar" style={{ width: '100%', position: 'relative', paddingTop: '20px', fontSize: '16px' }}>
        <img src="/logo.png" alt="Logo" className="logo" style={{ position: 'absolute', top: '10px', left: '10px', marginTop: '0' }} />
        <div className="reservation-details" style={{ marginLeft: '120px', marginTop: '20px', display: 'flex', alignItems: 'center', color: '#eac831', fontSize: '12px' }}>
          <p>Location: <span className="detail-value">{pickupLocation}</span></p>
          <p>Date From: <span className="detail-value">{safeDateFormat(dateFrom)}</span></p>
          <p>Date To: <span className="detail-value">{safeDateFormat(dateTo)}</span></p>
          <p>Duration: <span className="detail-value">{reservationDuration} days</span></p>
        </div>
      </div>
      <div className="catalog-container" style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px' }}>
        <div className="vehicle-list" style={{ zIndex: 9999, width: 'calc(100% - 320px)', height: '100%', overflowY: 'auto', overflowX: 'hidden', msOverflowStyle: 'none', scrollbarWidth: 'none', marginTop: '20px' }}>
          {loading && <p>Loading available vehicles...</p>}
          {error && <p>{error}</p>}
          {!loading && !error && filteredVehicles.length > 0 && (
            <div className="vehicle-grid">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="vehicle-item">
                  <img src={vehicle.thumbnail} alt={`${vehicle.mark}`} className="vehicle-thumbnail" />
                  <div className="vehicle-info">
                    <h3>{`${vehicle.mark} ${vehicle.year}`}</h3>
                    <p>Color: <span style={{ color: vehicle.colorCode }}>{vehicle.colorTitle || vehicle.color}</span></p>
                    <div className="vehicle-features">
                      <h4>Key Features:</h4>
                      <ul>
                        {vehicle.options.map((option, index) => (
                          <li key={index}>{option.name}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="vehicle-description-container" style={{ height: '15em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '10', WebkitBoxOrient: 'vertical' }}>
                      <p className="vehicle-description">{vehicle.description}</p>
                    </div>
                    <p className="price-info" style={{ color: '#eac831' }}>Daily Price: ${vehicle.price} | Trip Price: ${vehicle.total_price}</p>
                    <button className="reserve-now-btn" style={{ backgroundColor: '#eac831', color: 'black' }}>Reserve Now</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="sidebar" style={{ marginTop: '20px', width: '250px' }}>
          <div className="filter-section">
            <h3 className="gold-line">Filter by brand or model</h3>
            <input
              type="text"
              placeholder="Enter brand or model"
              value={filters.brandOrModel}
              onChange={e => setFilters({ ...filters, brandOrModel: e.target.value })}
              className="filter-input"
            />
          </div>
          <div className="filter-section">
            <h3 className="gold-line">Vehicle Type</h3>
            <select
              value={filters.vehicleType}
              onChange={e => setFilters({ ...filters, vehicleType: e.target.value })}
            >
              <option value="All">All</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Truck">Truck</option>
            </select>
          </div>
          <div className="filter-section">
            <h3 className="gold-line">Fuel Type</h3>
            <select
              value={filters.fuelType}
              onChange={e => setFilters({ ...filters, fuelType: e.target.value })}
            >
              <option value="All">All</option>
              <option value="Gasoline">Gasoline</option>
              <option value="Diesel">Diesel</option>
            </select>
          </div>
          <div className="filter-section">
            <h3 className="gold-line">Transmission</h3>
            <select
              value={filters.transmission}
              onChange={e => setFilters({ ...filters, transmission: e.target.value })}
            >
              <option value="All">All</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
          <div className="filter-section">
            <h3 className="gold-line">Max Trip Price</h3>
            <input
              type="range"
              min="0"
              max={maxPrice}
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value))}
              step="10"
            />
            <div className="price-label">
              <span>${currentPrice}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;
