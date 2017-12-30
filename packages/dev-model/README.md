# Reacolo Dev Model

The Reacolo dev model provides synchronization capabilities with [Reacolo Dev Server](../dev-server).

It complies with the Reacolo Model API and thus, is usable with the [`connect` HOC](../core/README.md#connect).

## Build

Currently, Reacolo have not been made available on any cdn nor repositories such as npm. But it will be soon. Promise.
In the meantime, you can build it as follow.

### [yarn](https://yarnpkg.com) (recommended)

```bash
yarn install
yarn build
```

### npm

```bash
npm install
npm run build
```

## Usage

```js
import React from 'react';
import { render } from 'react-dom';
import ReacoloDevModel from 'reacolo-dev-model';
import { Provider } from 'reacolo';
import MyApp from './myApp'

// Create the model sync, specifying the requested role for this client.
const model = new ReacoloDevModel(
  'http://my.reacolo.server:port/socket',
  'thisClientRole'
);

// Provides it to the component tree using Reacolo's Provider.
render(
  <Provider model={model}>
    <MyApp />
  </Provider>,
  document.getElementById('root')
);

// Start the synchronization.
model.start();
```
