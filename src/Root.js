import React from 'react';
import ReactDOM from 'react-dom';
import AppRouter from './components/Router';
import './index.css';
import reportWebVitals from './reportWebVitals';

const Root = () => {
  return (
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
};

export default Root; // Export the Root component

ReactDOM.render(<Root />, document.getElementById('root'));

reportWebVitals();
