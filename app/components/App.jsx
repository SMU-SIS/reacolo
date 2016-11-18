import React from 'react';
import './App.css';
import { EcologyFilter, RoleFilter, contextPropType } from '../reacolo';

const App = props => (
  <div>
    <h1>Hello {props.data.name || 'Anonymous'}!</h1>
    <EcologyFilter context={props.context} target={['1', '2']} method="strict">
      <RoleFilter context={props.context} target="1" >
        <div>1</div>
      </RoleFilter>
      <RoleFilter context={props.context} target="2" >
        <div>2</div>
      </RoleFilter>
      <div>more</div>
    </EcologyFilter>
    <EcologyFilter context={props.context} target={['1']} method="strict">
      <div>
        <div>1</div>
        <div>2</div>
      </div>
    </EcologyFilter>
  </div>
);

App.propTypes = {
  data: React.PropTypes.shape({
    name: React.PropTypes.string
  }).isRequired,
  context: contextPropType.isRequired
};

export default App;
