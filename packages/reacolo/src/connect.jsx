import React from 'react';
import ConnectHOC from './ConnectHOC.jsx';

const connect = (Component, model) => props => (
  <ConnectHOC {...props} model={model} Component={Component} />
);

export default connect;
