import React from 'react';
import ConnectHOC from './ConnectHOC';

const connect = (Component, model) => props => (
  <ConnectHOC model={model} Component={Component} {...props} />
);

export default connect;
