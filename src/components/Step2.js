import React, { useState, useEffect } from 'react';
import moment from 'moment';
import './App.css';
import './Step2.css';

const localStorageKey = 'vehicleDescriptions';

const saveVehicleDescription = (vehicleId, description, colorTitle) => {
  const existingEntries = JSON.parse(localStorage.getItem(localStorageKey)) || {};
  existingEntries[vehicleId] = { description, colorTitle };
  localStorage.setItem(localStorageKey, JSON.stringify(existingEntries));
};

const defaultFilters = {
  tripPrice: { min: 0, max: 1000 },
  vehicleType: 'All',
  fuelType: 'All',
  transmission: 'All',
  brandOrModel: '',
};

const Step2 = ({
  pickupLocation,
  dateFromURL,
  dateToURL,
  reservationDuration,
}) => {
  const [filters, setFilters] = useState(defaultFilters);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [localPickupLocation, setLocalPickupLocation] = useState('');
  const [localDateFrom, setLocalDateFrom] = useState('');
  const [localDateTo, setLocalDateTo] = useState('');
  const [duration, setDuration] = useState(localStorage.getItem('Duration') || '');

  useEffect(() => {
    // Read values from localStorage and update state
    const pickupLocation = localStorage.getItem('pickupLocation');
    const selectedAddress = localStorage.getItem('selectedAddress');
    const dateFrom = localStorage.getItem('dateFrom');
    const dateTo = localStorage.getItem('dateTo');

    if (pickupLocation) setLocalPickupLocation(pickupLocation);
    if (selectedAddress) setLocalPickupLocation(selectedAddress); // Use selectedAddress if available
    if (dateFrom) setLocalDateFrom(dateFrom);
    if (dateTo) setLocalDateTo(dateTo);

    if (dateFromURL && dateToURL) {
      const from = moment(dateFromURL, "YYYY-MM-DD HH:mm:ss");
      const to = moment(dateToURL, "YYYY-MM-DD HH:mm:ss");
      if (from.isValid() && to.isValid()) {
        const duration = Math.ceil(to.diff(from, 'days', true));
        localStorage.setItem('Duration', duration.toString());
      }
    }
  }, [dateFromURL, dateToURL]);

  const safeDateFormat = (dateInput) => {
    if (!dateInput || !moment(dateInput).isValid()) return 'Invalid Date';
    return moment(dateInput).format('MMMM D, YYYY [at] hh:mm A');
  };

  return (
    <div>
      <div className="top-bar">
      <img src={process.env.PUBLIC_URL + '/logo.png'} alt="G RIDES Logo" className="logo" />
        <div className="reservation-details">
          <p>Location: <span>{localStorage.getItem('selectedAddress') || localStorage.getItem('pickupLocation')}</span></p>
          <p>Date From: <span>{safeDateFormat(localDateFrom)}</span></p>
          <p>Date To: <span>{safeDateFormat(localDateTo)}</span></p>
          <p>Duration: <span>{duration} Days</span></p>
        </div>
      </div>
      <div className="catalog-container">
        <div className="vehicle-list">
          {/* Loading and error messages */}
        </div>
        <div className="sidebar">
          <div className="filter-section">
            <h3>Filter by brand or model</h3>
            <input
              type="text"
              placeholder="Enter brand or model"
              value={filters.brandOrModel}
              onChange={e => setFilters({ ...filters, brandOrModel: e.target.value })}
            />
          </div>
          <div className="filter-section">
            <h3>Vehicle Type</h3>
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
            <h3>Fuel Type</h3>
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
            <h3>Transmission</h3>
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
            <h3>Max Trip Price</h3>
            <input
              type="range"
              min="0"
              max="1000"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value))}
              step="10"
            />
            <div>
              <span>${currentPrice}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;
