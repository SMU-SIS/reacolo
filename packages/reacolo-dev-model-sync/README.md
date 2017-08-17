# Reacolo Dev Model Sync

The Reacolo dev model sync provides synchronization capabilities with [Reacolo Dev Server](../reacolo-dev-server).

It complies with Reacolo's ModelSync API and thus, is usable with the [`connect` HOC](../reacolo/README.md#connect).

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
import ReacoloDevModelSync from 'reacolo-dev-model-sync';
import { connect } from 'reacolo';

// Create the model sync, specifying the requested role for this client.
const modelSync = new ModelSync('http://my.reacolo.server:port/socket', 'thisClientRole');

// Connect it to a component using Reacolo connect.
const MyConnectedApp = connect(MyApp, modelSync);

// Render the component inside the root div using React.
render(<MyConnectedApp />, document.getElementById('root'));

// Start the synchronization.
modelSync.start();
```
