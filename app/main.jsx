import React from 'react';
import ReactDOM from 'react-dom';
import querystring from 'querystring';
import App from './components/App';
import ModelSync from './dirty-model-sync';

const pageArgs = querystring.parse(window.location.search.substring(1));
const contentDiv = document.getElementById('content');
const modelSync = new ModelSync(`http://${location.hostname}:3000/socket`, pageArgs.role);
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
