const jsonpatch = require('jsonpatch');

/**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {Object} Client
 * @property {function} send - Send a message to the client.
 */

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
      return Array.from(clients.values()).filter(r => r);
    },
    observerCount() {
      return Array.from(clients.values())
        .filter(r => !r)
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


/**
 * Create the server engines to handle the client messages.
 * @return {object} The engine
 */
module.exports = function createEngine() {
  // The client registry, used to store and monitor the clients as well as
  // their roles.
  const clientRegistry = createClientRegistry();
  // The data.
  let appData = {};
  let metaData = {};
  let appDataRevision = 0;

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

  // Handle the different client messages. Each handler's is fetched using a
  // client's message message type. They are all called the same way.
  const messageHandlers = {
    /**
     * Set the application data.
     * @param {object} messageData - The new data to set as application data.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {Client} client - The client that sent the message.
     * @return {undefined}
     */
    setAppData(messageData, messageId, client) {
      appData = messageData;
      appDataRevision += 1;
      sendMessage(client, 'ack', {
        success: true,
        messageId,
        response: { appDataRevision }
      });
      sendMessage(
        clientRegistry.clients().filter(c => c !== client),
        'appData',
        { appDataRevision, appData }
      );
    },

    /**
     * Patch the application data.
     * @param {object} patch - The RFC 6902 patch to apply.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {Client} client - The client that sent the message.
     * @return {undefined}
     */
    patchAppData(patch, messageId, client) {
      try {
        appData = jsonpatch.apply_patch(appData, patch);
        appDataRevision += 1;
        sendMessage(client, 'ack', {
          success: true,
          messageId,
          response: { appDataRevision }
        });
        sendMessage(
          clientRegistry.clients().filter(c => c !== client),
          'appData',
          { appDataRevision, appData }
        );
      } catch (e) {
        sendMessage(client, 'ack', {
          success: false,
          messageId,
          response: e.message
        });
      }
    },

    /**
     * Set the meta data data.
     * @param {object} messageData - The new data to set as meta data.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {Client} client - The client that sent the message.
     * @return {undefined}
     */
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

    /**
     * Handle request for the application data: send the current application
     * data to the requesting client.
     * @param {undefined} messageData - Ignored.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {Client} client - The client that sent the message.
     * @return {undefined}
     */
    appDataRequest(messageData, messageId, client) {
      sendMessage(client, 'ack', {
        success: true,
        messageId,
        response: {
          appDataRevision,
          appData
        }
      });
    },

    /**
     * Handle request for the context: send the current context to the
     * requesting client.
     * @param {undefined} messageData - Ignored.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {Client} client - The client that sent the message.
     * @return {undefined}
     */
    contextRequest(messageData, messageId, client) {
      sendMessage(client, 'ack', {
        success: true,
        messageId,
        response: getContext()
      });
    },

    /**
     * Set the role of the requesting client.
     * @param {string} messageData - The new role to set.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {Client} client - The client that sent the message.
     * @return {undefined}
     */
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

    /**
     * Set the role of the requesting client.
     * @param {string} messageData - The data of the event to broadcast.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {Client} client - The client that sent the message.
     * @return {undefined}
     */
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
    /**
     * Handle a message from the client.
     * @param  {string} type - The type of the message to handle.
     * @param  {string} id - The id of the message.
     * @param  {object} data - The data of the message.
     * @param  {Client} client - The client that sent the message.
     * @return {undefined}
     */
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

    /**
     * Handle a parsing error while processing a client message.
     * @param  {Error} err - The error.
     * @param  {Client} client - The client that sent the message.
     * @return {undefined}
     */
    handleParsingError(err, client) {
      const errMessage = `Cannot parse message: ${err}`;
      process.stderr.write(`${errMessage}\n`);
      sendMessage(client, 'ack', { success: false, response: errMessage });
    },

    /**
     * Register a new client
     * @param  {Client} client - The client.
     * @return {undefined}
     */
    addClient(client) {
      clientRegistry.addClient(client);
      // Notify the change of context.
      sendMessage(clientRegistry.clients(), 'context', getContext());
      // Log.
      print(
        `${new Date()} A user connected (#connected: ${clientRegistry.size})`
      );
    },

    /**
     * Remove a client
     * @param  {Client} client - The client.
     * @return {undefined}
     */
    removeClient(client) {
      clientRegistry.removeClient(client);
      sendMessage(clientRegistry.clients(), 'context', getContext());
      print(
        `${new Date()} A user disconnected (#connected: ${clientRegistry.size})`
      );
    }
  };
};
