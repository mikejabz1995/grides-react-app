import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import GateEntryPage from './components/GateEntryPage';
import Step1 from './components/Step1';
import Step2 from './components/Step2';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Step1} />
        <Route path="/gate-entry" component={GateEntryPage} />
        <Route path="/step2" component={Step2} />
      </Switch>
    </Router>
  );
};

export default App;