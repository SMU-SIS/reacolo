/**
 * @module reacolo-dev-model/server-interface
 * @private
 */

import pick from 'object.pick';
import mergeRequest from './merge-requests.js';
import {
  SET_DATA_MSG_TYPE,
  SET_CLIENT_ROLE_MSG_TYPE,
  PATCH_DATA_MSG_TYPE,
  MERGE_PATCH_DATA_MSG_TYPE,
  GET_DATA_MSG_TYPE,
  GET_META_DATA_MSG_TYPE,
  BROADCAST_USER_EVENT_MSG_TYPE,
  META_DATA_MSG_TYPE,
  DATA_MSG_TYPE,
  DATA_PATCH_MSG_TYPE,
  DATA_MERGE_PATCH_MSG_TYPE,
  USER_EVENT_MSG_TYPE,
  KEEP_ALIVE_MSG_TYPE
} from './constants/message-types.js';

/**
 * A function that does nothing.
 * @return {undefined}
 */
const NO_OP = () => {};

/**
 * Create a server interface.
 * @param {func} createSocket - Socket factory.
 * @param {module:reacolo-dev-model~ServerInterfaceHandlers} handlers - Handlers
 * for the server messages.
 * @return {module:reacolo-dev-model~ServerInterface} The server interface.
 * @private
 */
export default (
  createSocket,
  /**
   * @interface module:reacolo-dev-model~ServerInterfaceHandlers
   * @private
   */
  {
    /**
     * Handle updates of the (whole) data.
     * @function
     * @memberof module:reacolo-dev-model~ServerInterfaceHandlers#
     * @param {object} data - The new data.
     * @param {DataRevision} revision - The data revision.
     * @returns {undefined}
     */
    onDataUpdate = NO_OP,

    /**
     * Handle patches of the data.
     * @function
     * @memberof module:reacolo-dev-model~ServerInterfaceHandlers#
     * @param {object} patch - The [RFC 6902](http://tools.ietf.org/html/rfc6902)
     * patch.
     * @param {DataRevision} revision - The data revision resulting after
     * applying the patch.
     * @returns {undefined}
     */
    onDataPatch = NO_OP,

    /**
     * Handle merge patches of the data.
     * @function
     * @memberof module:reacolo-dev-model~ServerInterfaceHandlers#
     * @param {object} mergePatch - The [RFC 6902](http://tools.ietf.org/html/rfc6902)
     * patch.
     * @param {DataRevision} revision - The data revision resulting after
     * applying the patch.
     * @returns {undefined}
     */
    onDataMergePatch = NO_OP,

    /**
     * Handle updates of the meta-data.
     * @function
     * @memberof module:reacolo-dev-model~ServerInterfaceHandlers#
     * @param {object} metaData - The new meta-data.
     * @param {DataRevision} revision - The meta-data revision.
     * @returns {undefined}
     */
    onMetaDataUpdate = NO_OP,

    /**
     * Handle user events.
     * @function
     * @memberof module:reacolo-dev-model~ServerInterfaceHandlers#
     * @param {string} eventName - The name of the event.
     * @param {object} eventData - The data of the event.
     * @returns {undefined}
     */
    onUserEvent = NO_OP,

    /**
     * Handle disconnections from the server.
     * @function
     * @memberof module:reacolo-dev-model~ServerInterfaceHandlers#
     * @returns {undefined}
     */
    onDisconnected = NO_OP
  }
) => {
  const socket = createSocket({
    mergeRequest,
    onMessage(messageType, messageData) {
      switch (messageType) {
        case DATA_MSG_TYPE:
          onDataUpdate(messageData.data, messageData.revision);
          break;
        case DATA_PATCH_MSG_TYPE:
          onDataPatch(
            messageData.from,
            messageData.patch,
            messageData.revision
          );
          break;
        case META_DATA_MSG_TYPE:
          onMetaDataUpdate(messageData.metaData, messageData.revision);
          break;
        case USER_EVENT_MSG_TYPE:
          onUserEvent(messageData.eventName, messageData.eventData);
          break;
        case DATA_MERGE_PATCH_MSG_TYPE:
          onDataMergePatch(
            messageData.from,
            messageData.mergePatch,
            messageData.revision
          );
          break;
        case KEEP_ALIVE_MSG_TYPE:
          break;
        default:
          // eslint-disable-next-line no-console
          console.warn(`Unknown message type: ${messageType}`);
      }
    },
    onClose: onDisconnected
  });

  /**
   * @interface module:reacolo-dev-model~ServerInterface
   * @private
   */
  return {
    /**
     * Set the application data.
     * @param {DataRevision} from - The current (known)
     * revision.
     * @param {object} data - The new data.
     * @return {Promise<{revision:DataRevision}>} A promise resolved once the data has been
     * set.
     * @memberof module:reacolo-dev-model~ServerInterface#
     */
    setData: (from, data) =>
      socket
        .sendRequest(SET_DATA_MSG_TYPE, { from, data })
        .then(resp => pick(resp, ['revision'])),

    /**
     * Patch the application data.
     * @param {DataRevision} from - The current (known) revision.
     * @param {object} patch - An [RFC 6902](http://tools.ietf.org/html/rfc6902)
     * compatible patch.
     * @return {Promise<{revision:DataRevision, from: DataRevision}>}  A promise
     * resolved once the data has been patched.
     * @memberof module:reacolo-dev-model~ServerInterface#
     */
    patchData: (from, patch) =>
      socket
        .sendRequest(PATCH_DATA_MSG_TYPE, { patch, from })
        .then(resp => pick(resp, ['revision'])),

    /**
     * Patch the application data.
     * @param {DataRevision} from - The current (known) revision.
     * @param {object} mergePatch - An
     * [RFC 7396](http://tools.ietf.org/html/rfc7396) compatible merge patch.
     * @return {Promise<{revision:DataRevision, from: DataRevision}>}  A promise
     * resolved once the data has been patched.
     * @memberof module:reacolo-dev-model~ServerInterface#
     */
    mergePatchData: (from, mergePatch) =>
      socket
        .sendRequest(MERGE_PATCH_DATA_MSG_TYPE, { mergePatch, from })
        .then(resp => pick(resp, ['revision'])),

    /**
     * Set the role of the requesting client.
     * @param {string} role - The role to set.
     * @return {Promise<{ metaData:object, revision:DataRevision, clientRole:string }>}
     *  A promise resolved once the new role has been set.
     * @memberof module:reacolo-dev-model~ServerInterface#
     */
    setClientRole: role =>
      socket
        .sendRequest(SET_CLIENT_ROLE_MSG_TYPE, { role })
        .then(resp => pick(resp, ['metaData', 'revision', 'clientRole'])),

    /**
     * Set the role of the requesting client.
     * @param {string} eventName - The name of the event to broadcast.
     * @param {object} eventData - The data of the event.
     * @return {Promise<undefined>} A promise resolved once the event has been
     * broadcasted.
     * @memberof module:reacolo-dev-model~ServerInterface#
     */
    broadcastUserEvent: (eventName, eventData) =>
      socket
        .sendRequest(BROADCAST_USER_EVENT_MSG_TYPE, { eventName, eventData })
        .then(NO_OP),

    /**
     * Get the data from the server.
     * @return {Promise<{ data:object, revision:DataRevision }>} A promise
     *  resolved with the current data from the server.
     * @memberof module:reacolo-dev-model~ServerInterface#
     */
    getData: () =>
      socket
        .sendRequest(GET_DATA_MSG_TYPE)
        .then(resp => pick(resp, ['data', 'revision'])),

    /**
     * Get the meta-data from the server.
     * @return {Promise<{ metaData:object, revision:DataRevision }>} A promise
     * resolved with the current meta-data from the server.
     * @memberof module:reacolo-dev-model~ServerInterface#
     */
    getMetaData: () =>
      socket
        .sendRequest(GET_META_DATA_MSG_TYPE)
        .then(resp => pick(resp, ['metaData', 'revision'])),

    /**
     * Establish the connection with the server.
     * @return {Promise<undefined>} A promise resolved once the connection
     * has been established.
     * @memberof module:reacolo-dev-model~ServerInterface#
     */
    connect: () => socket.start().then(NO_OP)
  };
};
