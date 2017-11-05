/**
 * @module reacolo-dev-model/constants/message-types
 * @private
 */

// Setters.
export const SET_DATA_MSG_TYPE = 'setData';
export const SET_CLIENT_ROLE_MSG_TYPE = 'setClientRole';
export const PATCH_DATA_MSG_TYPE = 'patchData';
export const MERGE_PATCH_DATA_MSG_TYPE = 'mergePatchData';

// Client requests.
export const GET_DATA_MSG_TYPE = 'getData';
export const GET_META_DATA_MSG_TYPE = 'getMetaData';
export const BROADCAST_USER_EVENT_MSG_TYPE = 'broadcastUserEvent';

// Server Updates.
export const META_DATA_MSG_TYPE = 'metaData';
export const DATA_MSG_TYPE = 'data';
export const DATA_PATCH_MSG_TYPE = 'dataPatch';
export const DATA_MERGE_PATCH_MSG_TYPE = 'dataMergePatch';
export const USER_EVENT_MSG_TYPE = 'userEvent';

// Communication.
export const ACK_MSG_TYPE = 'ack';
export const BUNDLE_MSG_TYPE = 'bundle';
export const KEEP_ALIVE_MSG_TYPE = 'keepAlive';
