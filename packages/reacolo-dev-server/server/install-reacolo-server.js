const sockJS = require('sockjs');
const createEngine = require('./engine');

const installSocketHandlers = (sockJsServer) => {
  // Create the engine that will handle the client messages.
  const engine = createEngine();

  // Process socket messages.
  const handleSocketData = (dataStr, socketEntry) => {
    let data;
    try {
      data = JSON.parse(dataStr);
    } catch (err) {
      engine.handleParsingError(err, socketEntry);
    }
    // Support for bundle of messages.
    const msgList = Array.isArray(data) ? data : [data];
    msgList.forEach((message) => {
      engine.handleClientMessage(
        message.type,
        message.id,
        message.data,
        socketEntry
      );
    });
  };

  // Listen for socket connection.
  sockJsServer.on('connection', (socket) => {
    // Create a wrapper around the socket that is used outside this handler.
    const socketEntry = {
      send: socket.write.bind(socket)
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
 * @param expressServer - An express to install the reacolo server on.
 */
module.exports = function installReacoloServer(expressServer, prefix) {
  const wsServer = sockJS.createServer();
  installSocketHandlers(wsServer);
  // Plug the websocket server into the http server.
  wsServer.installHandlers(expressServer, { prefix: `/${prefix}` });
  return expressServer;
};
