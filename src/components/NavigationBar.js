// Assuming the filename is NavigationBar.js and it's located in src/components/

import React from 'react';
import './NavigationBar.css'; // Ensure this path matches your CSS file's location

const NavigationBar = ({ currentStep }) => {
  return (
    <nav aria-label="Main navigation">
      <ul>
        <li>Step {currentStep} of 4</li>
        {/* Additional navigation items can go here */}
      </ul>
    </nav>
  );
};

export default NavigationBar;
