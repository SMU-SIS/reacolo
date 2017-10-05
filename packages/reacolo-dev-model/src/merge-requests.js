/**
 * @module module:reacolo-dev-model/merge-request
 * @private
 */

import {
  SET_DATA_MSG_TYPE,
  SET_CLIENT_ROLE_MSG_TYPE,
  PATCH_DATA_MSG_TYPE,
  GET_DATA_MSG_TYPE,
  GET_META_DATA_MSG_TYPE
} from './constants/message-types.js';

/**
 * Merge two requests.
 *
 * @see module:reacolo-dev-model/reacolo-socket~requestMerger
 * @param  {{type: string, data: object}} lastRequest - The last request that
 * has been pushed before the new request.
 * @param  {{type: string, data: object}} newRequest - The new request.
 * @return {{type: string, data: object}} The request merged or undefined if the
 * two requests cannot be merged.
 * @private
 * @type {module:reacolo-dev-model/reacolo-socket~requestMerger}
 */
export default function mergeRequests(lastRequest, newRequest) {
  switch (newRequest.type) {
    // These requests are single shot: only the last one matters.
    // Hence we replace any pending request with the new one.
    case SET_CLIENT_ROLE_MSG_TYPE:
    case GET_META_DATA_MSG_TYPE:
    case GET_DATA_MSG_TYPE:
      // These requests overwrites any previous similar requests.
      return newRequest.type === lastRequest.type ? newRequest : undefined;
    case SET_DATA_MSG_TYPE:
      // Set app data request also overwrites patch data.
      return lastRequest.type === newRequest.type ||
      lastRequest.type === PATCH_DATA_MSG_TYPE
        ? newRequest
        : undefined;
    case PATCH_DATA_MSG_TYPE:
      return lastRequest.type === newRequest.type
        ? {
          type: PATCH_DATA_MSG_TYPE,
          data: {
            patch: [...lastRequest.data.patch, ...newRequest.data.patch],
            from: lastRequest.data.from
          }
        }
        : undefined;
    default:
      // By default it is safer not to merge.
      return undefined;
  }
}
