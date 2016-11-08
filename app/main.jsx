import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import ModelSync from './dirty-model-sync';

const modelSync = new ModelSync(`http://${location.hostname}:3000/socket`);
const setData = modelSync.set.bind(modelSync);
const contentDiv = document.getElementById('content');

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
