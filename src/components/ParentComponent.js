import React, { useState } from 'react';
import Step1 from './Step1';

const NextStep = (currentStep) => {
  // Define your new logic here for completely rebuilding NextStep
  // This can include updating the state, performing calculations, or any other operation
  // For example, you can decrement the current step
  return currentStep - 1;
};

const ParentComponent = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNextStep = () => {
    setCurrentStep((prevStep) => NextStep(prevStep));
  };

  return (
    <div>
      <Step1 onNextStep={handleNextStep} />
    </div>
  );
};

export default ParentComponent;
