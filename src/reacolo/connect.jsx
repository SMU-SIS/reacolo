import React from 'react';
import ReacoloBase from './ReacoloBase';

const connect = (appComponent, model) => props => (
  <ReacoloBase model={model} app={appComponent} {...props} />
);

export default connect;
