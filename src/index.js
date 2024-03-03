import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import GateEntryPage from './components/GateEntryPage'; // Import GateEntryPage component
import Step1 from './components/Step1'; // Import Step1 component
import Step2 from './components/Step2'; // Import Step2 component
import reportWebVitals from './reportWebVitals';

const root = createRoot(document.getElementById('root'));
root.render(
  <Router>
    <App />
  </Router>
);

reportWebVitals();
