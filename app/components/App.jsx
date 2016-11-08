import React from 'react';
import './App.css';


export default class App extends React.Component {

  render() {
    const name = this.props.appData.name || 'Anonymous';
    return (
      <div>
        <h1>Hello {name}!</h1>
      </div>
    );
  }

}

App.propTypes = {
  appData: React.PropTypes.shape({
    name: React.PropTypes.string
  }).isRequired
};
