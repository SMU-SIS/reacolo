/** @module engine */

const jsonpatch = require('jsonpatch');
const createClientRegistry = require('./client-registry');
const createDataRegistry = require('./data-registry');

/**
 * @typedef {Object} Client
 * @property {function} send - Send a message to the client.
 */


// Shortcut for process.stdout.write + new line.
const print = str => process.stdout.write(`${str}\n`);

/**
 * Create the server engines that handles messages from clients.
 * @return {engine~ReacoloEngine} The engine
 */
module.exports = function createEngine() {
  // The client registry, used to store and monitor the clients as well as
  // their roles.
  const clientRegistry = createClientRegistry();

  // The data.
  const appData = createDataRegistry({});
  const metaData = createDataRegistry({});

  // Send a message to a list of clients. In theory, this should only be called
  // by the helpers below to ensure consistency in the sent messages.
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

  // Helpers to send different type of messages.
  const sendAck = (success, client, messageId, response) =>
    sendMessage(client, 'ack', { success, messageId, response });
  const sendAppData = clients =>
    sendMessage(clients, 'appData', {
      revision: appData.revision,
      appData: appData.get()
    });
  const sendAppDataPatch = (clients, patch, from) =>
    sendMessage(clients, 'appDataPatch', {
      from,
      patch,
      revision: appData.revision
    });
  const sendMetaData = clients =>
    sendMessage(clients, 'metaData', {
      metaData: metaData.get(),
      revision: metaData.revision
    });
  const sendRoles = clients =>
    sendMessage(clients, 'roles', {
      roles: clientRegistry.clientRoles(),
      observers: clientRegistry.observerCount(),
      revision: clientRegistry.revision
    });
  const sendUserEvent = (clients, messageData) =>
    sendMessage(clients, 'userEvent', messageData);


  // Handle the different client messages. Each handler's is fetched using a
  // client's message message type. They are all called the same way.
  const messageHandlers = {
    /**
     * Set the application data.
     * @param {{ from, appData }} messageData - The new data to set as
     * application data. The from property must contain the previous known
     * revision.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    setAppData(messageData, messageId, client) {
      if (messageData.from !== appData.revision) {
        print(
          `warning: Data set from an outdated revision (request revision: ${messageData.from}, actual revision: ${appData.revision})`
        );
      }
      appData.set(messageData.appData);
      sendAppData(clientRegistry.clients().filter(c => c !== client));
      sendAck(true, client, messageId, { revision: appData.revision });
    },

    /**
     * Patch the application data.
     * @param {{from, patch}} messageData - The message data containing the id
     * of the revision it is applied on an RFC 6902 patch to apply.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    patchAppData(messageData, messageId, client) {
      try {
        if (messageData.from !== appData.revision) {
          print(
            `warning: Attempt to apply a patch built for an outdated data revision (patch's revision: ${messageData.from}, current data revision: ${appData.revision})`
          );
        }
        const currentRevision = appData.revision;
        appData.set(jsonpatch.apply_patch(appData.get(), messageData.patch));
        sendAppDataPatch(
          clientRegistry.clients().filter(c => c !== client),
          messageData.patch,
          currentRevision
        );
        sendAck(true, client, messageId, { revision: appData.revision });
      } catch (e) {
        const error = `Patch application failed: ${e.message}`;
        process.stderr.write(`${error}\n`);
        sendAck(false, client, messageId, error);
      }
    },

    /**
     * Handle request for the application data: send the current application
     * data to the requesting client.
     * @param {undefined} messageData - Ignored.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    appDataRequest(messageData, messageId, client) {
      sendAck(true, client, messageId, {
        revision: appData.revision,
        appData: appData.get()
      });
    },

    /**
     * Set the meta data data.
     * @param {{ from, metaData }} messageData - The new data to set as meta
     * data.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    setMetaData({ from, metaData: newMetaData }, messageId, client) {
      if (from !== metaData.revision) {
        process.stdout.write(
          `warning: metaData set from an outdated context revision (request revision: ${from}, actual context revision: ${metaData.revision})`
        );
      }
      metaData.set(newMetaData);
      // Notify the change of context to the other clients.
      sendMetaData(clientRegistry.clients().filter(c => c !== client));
      // Acknowledge with the new context.
      sendAck(true, client, messageId, {
        revision: metaData.revision
      });
    },

    /**
     * Handle request for the meta data: send the current context to the
     * requesting client.
     * @param {undefined} _ - Ignored.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    metaDataRequest(_, messageId, client) {
      sendAck(true, client, messageId, {
        metaData: metaData.get(),
        revision: metaData.revision
      });
    },

    /**
     * Handle request for the roles: send the current available roles to the
     * requesting client.
     * @param {undefined} _ - Ignored.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    rolesRequest(_, messageId, client) {
      sendAck(true, client, messageId, {
        roles: clientRegistry.clientRoles(),
        observers: clientRegistry.observerCount(),
        revision: clientRegistry.revision
      });
    },

    /**
     * Set the role of the requesting client.
     * @param {{ role }} messageData - Contains the new role to set as a
     * property.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    setClientRole({ role }, messageId, client) {
      if (typeof role !== 'string') {
        const errMessage = `Incorrect role type: "${role}".`;
        process.stderr.write(`${errMessage}\n`);
        sendAck(false, client, messageId, errMessage);
      } else {
        clientRegistry.setClientRole(client, role);
        // Notify the change of context to the other clients.
        sendRoles(clientRegistry.clients().filter(c => c !== client));
        sendAck(true, client, messageId, {
          clientRole: role,
          roles: clientRegistry.clientRoles(),
          observers: clientRegistry.observerCount(),
          revision: clientRegistry.revision
        });
      }
    },

    /**
     * Set the role of the requesting client.
     * @param {string} messageData - The data of the event to broadcast.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    broadcastUserEvent(messageData, messageId, client) {
      sendUserEvent(
        clientRegistry.clients().filter(s => s !== client),
        messageData
      );
      sendAck(true, client, messageId);
    }
  };


  /**
   * @interface engine~ReacoloEngine
   */
  return {
    /**
     * Handle a message from the client.
     * @memberof engine~ReacoloEngine#
     * @param  {string} type - The type of the message to handle.
     * @param  {string} id - The id of the message.
     * @param  {object} data - The data of the message.
     * @param  {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    handleClientMessage(type, id, data, client) {
      // Look for an appropriate way to handle this particular message.
      const handler = messageHandlers[type];
      if (!handler) {
        // If we cannot find a handler, we send an acknowledgement notifying
        // that the request failed.
        const errMessage = `Unknown message type: "${type}".`;
        sendAck(false, client, id, errMessage);
        process.stderr.write(`${errMessage}\n`);
        return;
      }
      // Handle the message.
      handler(data, id, client);
    },

    /**
     * Handle a parsing error while processing a client message.
     * @memberof engine~ReacoloEngine#
     * @param  {Error} err - The error.
     * @param  {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    handleParsingError(err, client) {
      const errMessage = `Cannot parse message: ${err}`;
      sendAck(false, client, undefined, errMessage);
      process.stderr.write(`${errMessage}\n`);
    },

    /**
     * Register a new client.
     * @memberof engine~ReacoloEngine#
     * @param  {module:engine~Client} client - The client.
     * @return {undefined}
     */
    addClient(client) {
      clientRegistry.addClient(client);
      // Notify the change of context.
      sendRoles(clientRegistry.clients());
      // Log.
      print(
        `${new Date()} A user connected (#connected: ${clientRegistry.size})`
      );
    },

    /**
     * Remove a client.
     * @memberof engine~ReacoloEngine#
     * @param  {module:engine~Client} client - The client.
     * @return {undefined}
     */
    removeClient(client) {
      clientRegistry.removeClient(client);
      // Notify the change of context.
      sendRoles(clientRegistry.clients());
      print(
        `${new Date()} A user disconnected (#connected: ${clientRegistry.size})`
      );
    }
  };
};
