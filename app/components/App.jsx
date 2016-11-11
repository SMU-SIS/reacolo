import React from 'react';
import './App.css';

const App = props => (
  <div>
    <h1>Hello {props.data.name || 'Anonymous'}!</h1>
  </div>
);

App.propTypes = {
  data: React.PropTypes.shape({
    name: React.PropTypes.string
  }).isRequired
};

export default App;
