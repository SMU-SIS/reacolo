/** @module reacolo-dev-model */

import createModel from './model.js';
import createModelData from './model-data.js';
import ReacoloSocket from './reacolo-socket.js';

export * from './constants/events.js';
export * from './constants/errors.js';
export * from './constants/status.js';

/**
 * Creates a ReacoloDevModel.
 *
 * @param {string} [serverAddress] - The address of the reacolo-dev-sever to
 * synchronize with.
 * @param {string} [initClientRole] - The role of this client.
 * @param {Object} [options] - A list of additional options.
 * @param {number} [options.requestThrottle] - The minimum time between two
 * server requests.
 * @param {number} [options.requestTimeout] - The maximum time to wait for a
 * server response.
 * @return {module:reacolo-dev-model~Model} The model.
 */
export const create = (
  serverAddress = `http://${window.location.host}/socket`,
  initClientRole = undefined,
  { requestThrottle = 50, requestTimeout = 20000 } = {}
) => {
  /**
   * Callback to create the server interface.
   * @param {object} options - Socket options.
   * @param {func} options.onSocketMessage - Called when the socket receives a message.
   * @param {func} options.onSocketClose - Called when the socket gets closed.
   * @param {func} options.mergeRequest - Used by the socket to merge two requests
   * together.
   * @return {undefined}
   * @private
   */
  const createInterface = ({ onMessage, onClose, mergeRequest }) =>
    new ReacoloSocket(
      serverAddress,
      onMessage,
      onClose,
      mergeRequest,
      requestTimeout,
      requestThrottle
    );

  return createModel(
    createInterface,
    createModelData,
    initClientRole
  );
};
