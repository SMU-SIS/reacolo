import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import ModelSync from './dirty-model-sync';

const contentDiv = document.getElementById('content');
const modelSync = new ModelSync(`http://${location.hostname}:3000/socket`, 'app');
const setData = (...args) => modelSync.setAppData(...args);

modelSync.onUpdate = (data, context) => {
  if (data) {
    ReactDOM.render(
      <App
        data={data}
        context={context}
        setData={setData}
      />,
      contentDiv
    );
  }
};
