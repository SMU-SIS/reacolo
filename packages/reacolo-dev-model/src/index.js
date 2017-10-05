/** @module reacolo-dev-model */

import createModel from './model.js';
import createModelData from './model-data.js';
import ReacoloSocket from './reacolo-socket.js';
import ServerInterface from './server-interface.js';

export * from './constants/events.js';
export * from './constants/errors.js';
export * from './constants/status.js';

/**
 * Creates a ReacoloDevModel.
 * @function
 * @param {string} [serverAddress=`http://${window.location.host}/socket`] - The
 * address of the reacolo-dev-sever to synchronize with.
 * @param {string} [initClientRole] - The role of this client.
 * @param {Object} [options] - A list of additional options.
 * @param {number} [options.requestThrottle=50] - The minimum time between two
 * server requests.
 * @param {number} [options.requestTimeout = 20000] - The maximum time to wait
 * for a server response.
 * @return {module:reacolo-dev-model~Model} The model.
 */
export const create = (
  serverAddress = `http://${window.location.host}/socket`,
  initClientRole = undefined,
  { requestThrottle = 50, requestTimeout = 20000 } = {}
) => {
  const createSocket = ({ onMessage, onClose, mergeRequest }) =>
    new ReacoloSocket(
      serverAddress,
      onMessage,
      onClose,
      mergeRequest,
      requestTimeout,
      requestThrottle
    );
  const createInterface = handlers => ServerInterface(createSocket, handlers);
  return createModel(createInterface, createModelData, initClientRole);
};
