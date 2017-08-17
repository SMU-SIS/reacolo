const express = require('express');
const http = require('http');
const path = require('path');
const installReacoloServer = require('./install-reacolo-server');

module.exports = function startReacoloServer(
  port = 3000,
  socketPrefix = 'socket',
  interfacePath = path.resolve(__dirname, '../server_interface/dist')
) {
  // Init server components.
  const app = express();
  const server = http.Server(app);

  // Install reacolo's websocket handlers.
  installReacoloServer(server, socketPrefix);

  // Serves the interface.
  app.use(express.static(interfacePath));

  // Start the server.
  server.listen(port, () =>
    process.stdout.write(`${new Date()} Listening on *:3000\n`)
  );
};

module.exports.install = installReacoloServer;
