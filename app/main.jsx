import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import ModelSync from './dirty-model-sync';

const contentDiv = document.getElementById('content');
const modelSync = new ModelSync(`http://${location.hostname}:3000/socket`, 'app');
const setData = (...args) => modelSync.set(...args);

modelSync.onUpdate = (model) => {
  ReactDOM.render(
    <App
      appData={model.appData}
      metaData={model.metaData}
      setData={setData}
    />,
    contentDiv
  );
};
