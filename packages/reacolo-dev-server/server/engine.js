/** @module engine */

const jsonpatch = require('jsonpatch');
const jsonMergePatch = require('tiny-merge-patch');
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
  // The data.
  const data = createDataRegistry({});

  // The client registry, used to store and monitor the clients as well as
  // their roles.
  const clientRegistry = createClientRegistry();

  // Metadata getters. Currently the meta data is only about what roles are
  // present or not.
  const getMetaData = () => ({
    roles: clientRegistry.clientRoles(),
    observers: clientRegistry.observerCount()
  });
  const getMetaDataRevision = () => clientRegistry.revision;

  // Send a message to a list of clients. In theory, this should only be called
  // by the helpers below to ensure consistency in the sent messages.
  const sendMessage = (clientOrClients, type, msgData) => {
    const msg = JSON.stringify([type, msgData]);
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
    sendMessage(client, 'ack', [messageId, success, response]);
  const sendAppData = clients =>
    sendMessage(clients, 'data', {
      revision: data.revision,
      data: data.get()
    });
  const sendAppDataPatch = (clients, patch, from) =>
    sendMessage(clients, 'dataPatch', {
      from,
      patch,
      revision: data.revision
    });
  const sendAppDataMergePatch = (clients, mergePatch, from) =>
    sendMessage(clients, 'dataMergePatch', {
      from,
      mergePatch,
      revision: data.revision
    });
  const sendMetaData = clients =>
    sendMessage(clients, 'metaData', {
      metaData: getMetaData(),
      revision: getMetaDataRevision()
    });
  const sendUserEvent = (clients, messageData) =>
    sendMessage(clients, 'userEvent', messageData);

  // Handle the different client messages. Each handler's is fetched using a
  // client's message message type. They are all called the same way.
  const messageHandlers = {
    /**
     * Set the application data.
     * @param {{ from, data }} messageData - The new data to set as
     * application data. The from property must contain the previous known
     * revision.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    setData(messageData, messageId, client) {
      if (messageData.from !== data.revision) {
        print(
          `warning: Data set from an outdated revision (request revision: ${messageData.from}, actual revision: ${data.revision})`
        );
      }
      data.set(messageData.data);
      sendAppData(clientRegistry.clients().filter(c => c !== client));
      sendAck(true, client, messageId, { revision: data.revision });
    },

    /**
     * Patch the application data.
     * @param {{from, patch}} messageData - The message data containing the id
     * of the revision it is applied on an
     * [RFC 6902](https://tools.ietf.org/html/rfc6902) patch to apply.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    patchData(messageData, messageId, client) {
      try {
        if (messageData.from !== data.revision) {
          print(
            `warning: Attempting to apply a patch for an outdated data revision (patch's revision: ${messageData.from}, current data revision: ${data.revision})`
          );
        }
        const currentRevision = data.revision;
        data.set(jsonpatch.apply_patch(data.get(), messageData.patch));
        sendAppDataPatch(
          clientRegistry.clients().filter(c => c !== client),
          messageData.patch,
          currentRevision
        );
        sendAck(true, client, messageId, {
          revision: data.revision,
          from: currentRevision
        });
      } catch (e) {
        const error = `Patch application failed: ${e.message}`;
        process.stderr.write(`${error}\n`);
        sendAck(false, client, messageId, error);
      }
    },

    /**
     * Patch the application data.
     * @param {{from, mergePatch}} messageData - The message data containing the id
     * of the revision it is applied on an
     * [RFC 7396](https://tools.ietf.org/html/rfc7396) patch to apply.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    mergePatchData(messageData, messageId, client) {
      try {
        if (messageData.from !== data.revision) {
          print(
            `warning: Attempting to apply a patch for an outdated data revision (patch's revision: ${messageData.from}, current data revision: ${data.revision})`
          );
        }
        const currentRevision = data.revision;
        data.set(jsonMergePatch.apply(data.get(), messageData.mergePatch));
        sendAppDataMergePatch(
          clientRegistry.clients().filter(c => c !== client),
          messageData.mergePatch,
          currentRevision
        );
        sendAck(true, client, messageId, {
          revision: data.revision,
          from: currentRevision
        });
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
    getData(messageData, messageId, client) {
      sendAck(true, client, messageId, {
        revision: data.revision,
        data: data.get()
      });
    },

    /**
     * Handle request for the meta data: send the current metadata to the
     * requesting client.
     * @param {undefined} _ - Ignored.
     * @param {string} messageId - The identifier of the message (important
     * for the acknowledgement).
     * @param {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    getMetaData(_, messageId, client) {
      sendAck(true, client, messageId, {
        metaData: getMetaData(),
        revision: getMetaDataRevision()
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
        sendMetaData(clientRegistry.clients().filter(c => c !== client));
        sendAck(true, client, messageId, {
          clientRole: role,
          metaData: getMetaData(),
          revision: getMetaDataRevision()
        });
      }
    },

    /**
     * Broadcast a custom event to every other clients.
     * @param {{ eventName, eventData }} messageData - The event to broadcast.
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
     * @param  {string} id - The message's id.
     * @param  {object} msgData - The message's data.
     * @param  {module:engine~Client} client - The client that sent the message.
     * @return {undefined}
     */
    handleClientMessage(type, id, msgData, client) {
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
      handler(msgData, id, client);
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
      sendMetaData(clientRegistry.clients());
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
      sendMetaData(clientRegistry.clients());
      print(
        `${new Date()} A user disconnected (#connected: ${clientRegistry.size})`
      );
    }
  };
};
