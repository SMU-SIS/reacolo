const SERVER_PROPS = ['observers', 'roles'];
const CLIENT_PROPS = ['clientRole'];

// Shortcut for process.stdout.write + new line.
const print = str => process.stdout.write(`${str}\n`);

// Register handle the role of the different clients.
const createClientRegistry = () => {
  const clients = new Map();

  return {
    addClient(client, role = undefined) {
      clients.set(client, role);
    },
    setClientRole(client, role) {
      clients.set(client, role);
    },
    removeClient(client) {
      clients.delete(client);
    },
    clientRoles() {
      return Array.from(clients.values()).map(r => r).filter(r => r);
    },
    observerCount() {
      return Array.from(clients.values())
        .map(r => !r)
        .reduce(count => count + 1, 0);
    },
    clients() {
      return Array.from(clients.keys());
    },
    get size() {
      return clients.size;
    }
  };
};

module.exports = () => {
  // The data.
  const clientRegistry = createClientRegistry();
  let appData = {};
  let metaData = {};

  // Return the current context (metadata + client roles + observer count)/
  const getContext = () =>
    Object.assign(
      {
        roles: clientRegistry.clientRoles(),
        observers: clientRegistry.observerCount()
      },
      metaData
    );

  // Send a message to a list of clients.
  const sendMessage = (clientOrClients, type, data) => {
    const msg = JSON.stringify({ type, data });
    if (clientOrClients.send) {
      clientOrClients.send(msg);
    } else {
      clientOrClients.forEach((client) => {
        client.send(msg);
      });
    }
  };

  // Handle the different client messages.
  const messageHandlers = {
    setAppData(messageData, messageId, client) {
      appData = messageData;
      sendMessage(client, 'ack', { success: true, messageId });
      sendMessage(
        clientRegistry.clients().filter(c => c !== client),
        'appData',
        appData
      );
    },

    setMetaData(messageData, messageId, client) {
      if (SERVER_PROPS.some(prop => messageData[prop])) {
        process.stderr.write(
          'Attempt to update a server managed context property\n'
        );
        sendMessage(client, 'ack', {
          success: false,
          response:
            'Context property "roles" and "observers" are managed by the server.',
          messageId
        });
      } else if (CLIENT_PROPS.some(prop => messageData[prop])) {
        process.stderr.write(
          'Attempt to update a client specific context property\n'
        );
        sendMessage(client, 'ack', {
          success: false,
          response: 'Context property "clientRole" is managed by each client.',
          messageId
        });
      } else {
        metaData = messageData;
        const context = getContext();
        // Notify the change of context to the other clients.
        sendMessage(
          clientRegistry.clients().filter(c => c !== client),
          'context',
          context
        );
        // Acknowledge with the new context.
        sendMessage(client, 'ack', {
          success: true,
          messageId,
          response: context
        });
      }
    },

    appDataRequest(messageData, messageId, client) {
      sendMessage(client, 'ack', {
        success: true,
        messageId,
        response: appData
      });
    },

    contextRequest(messageData, messageId, client) {
      sendMessage(client, 'ack', {
        success: true,
        messageId,
        response: getContext()
      });
    },

    setClientRole(messageData, messageId, client) {
      if (typeof messageData !== 'string') {
        const errMessage = `Incorrect role type: "${messageData}".`;
        process.stderr.write(`${errMessage}\n`);
        sendMessage(client, 'ack', {
          success: false,
          response: errMessage,
          messageId
        });
      } else {
        clientRegistry.setClientRole(client, messageData);
        sendMessage(
          clientRegistry.clients().filter(c => c !== client),
          'context',
          getContext()
        );
        sendMessage(client, 'ack', {
          success: true,
          messageId,
          response: messageData
        });
      }
    },

    broadcastUserEvent(messageData, messageId, client) {
      sendMessage(
        clientRegistry.clients().filter(s => s !== client),
        'userEvent',
        messageData
      );
      sendMessage(client, 'ack', {
        success: true,
        messageId,
        response: messageData
      });
    }
  };

  return {
    handleClientMessage(type, id, data, client) {
      // Look for an appropriate way to handle this particular message.
      const handler = messageHandlers[type];
      if (!handler) {
        // If we cannot find a handler, we send an acknowledgement notifying
        // that the request failed.
        const errMessage = `Unknown message type: "${type}".`;
        sendMessage(client, 'ack', {
          success: false,
          response: errMessage,
          messageId: id
        });
        process.stderr.write(`${errMessage}\n`);
        return;
      }
      // Handle the message.
      handler(data, id, client);
    },
    handleParsingError(err, client) {
      const errMessage = `Cannot parse message: ${err}`;
      process.stderr.write(`${errMessage}\n`);
      sendMessage(client, 'ack', { success: false, response: errMessage });
    },
    // Register a new connection.
    addClient(client) {
      clientRegistry.addClient(client);
      // Notify the change of context.
      sendMessage(clientRegistry.clients(), 'context', getContext());
      // Log.
      print(
        `${new Date()} A user connected (#connected: ${clientRegistry.size})`
      );
    },
    // Register that a client left.
    removeClient(client) {
      clientRegistry.removeClient(client);
      sendMessage(clientRegistry.clients(), 'context', getContext());
      print(
        `${new Date()} A user disconnected (#connected: ${clientRegistry.size})`
      );
    }
  };
};
