/**
 * @module reacolo-dev-model/constants/status
 * @private
 */

/**
 * Status of the model when it is still attempting to connect to the server.
 *
 * @type {'connecting'}
 * @alias module:reacolo-dev-model.CONNECTING_STATUS
 */
export const CONNECTING_STATUS = 'connecting';

/**
 * Status of the model when it is connected to the server and ready for
 * use.
 *
 * @type {'ready'}
 * @alias module:reacolo-dev-model.READY_STATUS
 */
export const READY_STATUS = 'ready';

/**
 * Status of the model when it has been disconnected from the server.
 *
 * @type {'disconnected'}
 * @alias module:reacolo-dev-model.DISCONNECTED_STATUS
 */
export const DISCONNECTED_STATUS = 'disconnected';

/**
 * Status of the model when it encountered and unrecoverable error.
 *
 * @type {'error'}
 * @alias module:reacolo-dev-model.ERROR_STATUS
 */
export const ERROR_STATUS = 'error';
