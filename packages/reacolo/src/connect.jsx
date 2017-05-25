import React from 'react';
import ConnectHOC from './ConnectHOC.jsx';

const connect = (Component, model) => props => (
  <ConnectHOC model={model} Component={Component} {...props} />
);

export default connect;
