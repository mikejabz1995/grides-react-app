import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './GateEntryPage.css';

const GateEntryPage = () => {
  const [showEntryGate, setShowEntryGate] = useState(true);
  const history = useHistory();

  useEffect(() => {
    const gifDuration = 11000; // Duration of the GIF in milliseconds
    const timer = setTimeout(() => {
      setShowEntryGate(false);
      history.push('/step1'); // Navigate to Step1 after the GIF plays
    }, gifDuration);

    return () => clearTimeout(timer);
  }, [history]);

  return (
    <div className="gate-entry-page">
      {showEntryGate && (
        <img 
          src={`${process.env.PUBLIC_URL}/glitter.gif`} 
          alt="Entry Gate" 
          className="entry-gate-image"
        />
      )}
    </div>
  );
};

export default GateEntryPage;
