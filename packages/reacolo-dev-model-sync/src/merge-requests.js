import * as MessageTypes from './message-types.js';

/**
 * Merge two requests.
 * @param  {{type: string, data: object}} lastRequest - The last request that
 * has been pushed before the new request.
 * @param  {{type: string, data: object}} newRequest - The new request.
 * @return {{type: string, data: object}} The request merged or undefined if the
 * two requests cannot be merged.
 */
const mergeRequest = (lastRequest, newRequest) => {
  switch (newRequest.type) {
    // These requests are single shot: only the last one matters.
    // Hence we replace any pending request with the new one.
    case MessageTypes.SET_CLIENT_ROLE_MSG_TYPE:
    case MessageTypes.ROLES_REQUEST_MSG_TYPE:
    case MessageTypes.SET_META_DATA_MSG_TYPE:
    case MessageTypes.META_DATA_REQUEST_MSG_TYPE:
    case MessageTypes.APP_DATA_REQUEST_MSG_TYPE:
      // These requests overwrites any previous similar requests.
      return newRequest.type === lastRequest.type ? newRequest : undefined;
    case MessageTypes.SET_APP_DATA_MSG_TYPE:
      // Set app data request also overwrites patch data.
      return lastRequest.type === newRequest.type ||
      lastRequest.type === MessageTypes.PATCH_DATA_MSG_TYPE
        ? newRequest
        : undefined;
    case MessageTypes.PATCH_DATA_MSG_TYPE:
      return lastRequest.type === newRequest.type
        ? {
          type: 'patchAppData',
          data: [...lastRequest.data, ...newRequest.data]
        }
        : undefined;
    default:
      // By default it is safer not to merge.
      return undefined;
  }
};

export default mergeRequest;
