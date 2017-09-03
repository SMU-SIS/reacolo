const sockJS = require('sockjs');
const createEngine = require('./engine');

const installSocketHandlers = (sockJsServer, keepAlive = 100) => {
  // Create the engine that will handle the client messages.
  const engine = createEngine();

  // Handle parsed socket messages.
  const handleSocketMessage = (message, socketEntry) => {
    try {
      // Check the message format.
      if (!Array.isArray(message) || message.length < 2 || message.length > 3) {
        throw new Error('Messages does not look like [type, messageId, data]');
      }
      if (message[0] === 'bundle') {
        // Handle bundles.
        if (!Array.isArray(message[2])) {
          throw new Error('Bundles must be arrays of messages');
        }
        message[2].forEach(m => handleSocketMessage(m, socketEntry));
      } else {
        // Handle single messages.
        engine.handleClientMessage(
          message[0],
          message[1],
          message[2],
          socketEntry
        );
      }
    } catch (err) {
      engine.handleParsingError(err, socketEntry);
    }
  };

  // Parse and handle socket messages.
  const handleSocketData = (dataStr, socketEntry) => {
    let message;
    try {
      message = JSON.parse(dataStr);
    } catch (err) {
      engine.handleParsingError(err, socketEntry);
    }
    handleSocketMessage(message, socketEntry);
  };

  // Listen for socket connection.
  sockJsServer.on('connection', (socket) => {
    // Set up keep alive if needed.
    let keepAliveIntervalId;
    const setupKeepAlive = () => {
      clearInterval(keepAliveIntervalId);
      keepAliveIntervalId = setInterval(
        () => socket.write('["keepAlive"]'),
        keepAlive
      );
    };
    if (keepAlive != null) setupKeepAlive();

    // Create a wrapper around the socket that is used outside this handler.
    const socketEntry = {
      send:
        keepAlive == null
          ? socket.write.bind(socket)
          : (...args) => {
            // Reset the keep alive interval.
            setupKeepAlive();
            socket.write(...args);
          }
    };

    engine.addClient(socketEntry);

    // Update the data on client message.
    socket.on('data', dataStr => handleSocketData(dataStr, socketEntry));

    // Unregister the socket when it gets closed.
    socket.on('close', () => {
      engine.removeClient(socketEntry);
    });
  });

  return sockJsServer;
};

/**
 * Install the reacolo server on an express application. Does not mount the
 * server interface.
 * @module
 * @param {object} expressServer - An express to install the reacolo server on.
 * @param {string} prefix - The websocket handlers' address prefix.
 * @return {object} The express server with the handlers installed.
 */
module.exports = function installReacoloServer(expressServer, prefix) {
  const wsServer = sockJS.createServer();
  installSocketHandlers(wsServer);
  // Plug the websocket server into the http server.
  wsServer.installHandlers(expressServer, { prefix: `/${prefix}` });
  return expressServer;
};
