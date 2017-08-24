const express = require('express');
const http = require('http');
const path = require('path');
const installReacoloServer = require('./install-reacolo-server');

/**
 * Start the server.
 * @param  {Number} [port=3000] - The port on which to start the server
 * @param  {String} [socketPrefix='socket'] - The prefix of the socket handler.
 * @param  {string} [interfacePath] - The path of the server interface static
 * files (default is the server_interface's dist directory).
 * @return {undefined}
 */
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
