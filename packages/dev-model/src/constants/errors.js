/**
 * @module reacolo-dev-model/constants/errors
 * @private
 */

/**
 * @type {Error}
 * @alias module:reacolo-dev-model.NotConnectedError
 */
export class NotConnectedError extends Error {}

/**
 * @type {Error}
 * @alias module:reacolo-dev-model.RequestTimeoutError
 */
export class RequestTimeoutError extends Error {}

/**
 * @type {Error}
 * @alias module:reacolo-dev-model.RequestFailedError
 */
export class RequestFailedError extends Error {}

/**
 * @type {Error}
 * @alias module:reacolo-dev-model.AlreadyConnectedError
 */
export class AlreadyConnectedError extends Error {}
