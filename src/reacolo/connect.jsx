import React from 'react';
import ReacoloBase from './ReacoloBase';

const connect = (appComponent, model) => (
  <ReacoloBase model={model} app={appComponent} />
);

export default connect;
