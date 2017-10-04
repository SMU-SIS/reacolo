/**
 * @module reacolo-dev-model/create
 * @private
 */

import EventEmitter from 'eventemitter3';
import jsonPatch from 'jsonpatch';
import mergeRequest from './merge-requests.js';
import scopePatch from './scope-path.js';
import {
  SET_CLIENT_ROLE_MSG_TYPE,
  PATCH_DATA_MSG_TYPE,
  GET_DATA_MSG_TYPE,
  GET_META_DATA_MSG_TYPE,
  BROADCAST_USER_EVENT_MSG_TYPE,
  META_DATA_MSG_TYPE,
  DATA_MSG_TYPE,
  DATA_PATCH_MSG_TYPE,
  USER_EVENT_MSG_TYPE,
  KEEP_ALIVE_MSG_TYPE
} from './constants/message-types.js';
import { MODEL_UPDATE_EVT } from './constants/events.js';
import {
  CONNECTING_STATUS,
  READY_STATUS,
  DISCONNECTED_STATUS,
  ERROR_STATUS
} from './constants/status.js';
import { AlreadyConnectedError } from './constants/errors.js';

/**
 * Creates a ReacoloDevModel.
 *
 * @param {func} createInterface - Server interface factory.
 * @param {func} createModelData - Model data factory.
 * @param {string} [initClientRole] - The initial client role.
 * @return {module:reacolo-dev-model~Model} The model.
 */
export default (createInterface, createModelData, initClientRole) => {
  /**
   * Manage the model's event.
   * @private
   */
  const emitter = new EventEmitter();

  /**
   * Store the data and manage the model's context and state.
   * @type {module:reacolo-dev-model~ModelData}
   * @private
   */
  const modelData = createModelData({
    initClientRole,
    initModelStatus: CONNECTING_STATUS,
    onUpdate(modelValue) {
      emitter.emit(MODEL_UPDATE_EVT, modelValue, true);
    }
  });

  /**
   * The server socket.
   * @type {reacolo-socket~ReacoloSocket}
   * @private
   */
  const serverInterface = createInterface({
    // Merge requests together.
    mergeRequest,

    /**
   * Process socket messages.
   *
   * @param {string|number} messageType - The type of the message.
   * @param {object} messageData - The data of the message.
   * @return {undefined}
   *
   * @private
   */
    onMessage(messageType, messageData) {
      if (modelData.getModelStatus() !== READY_STATUS) return;
      switch (messageType) {
        case DATA_MSG_TYPE:
          modelData.setData(messageData.data, messageData.revision);
          break;
        case DATA_PATCH_MSG_TYPE:
          if (modelData.getDataRevision() !== messageData.from) {
            // If the patch is applied on a revision different from the current
            // revision, we do not apply the patch and instead ask the server
            // for a full data update.
            // eslint-disable-next-line no-console
            console.warn(
              `Received a data patch from unknown revision: ${messageData.from} (current is ${modelData.getDataRevision()}). Requesting a full data update.`
            );
            serverInterface.sendRequest(GET_DATA_MSG_TYPE);
          } else {
            modelData.set({
              data: {
                value: jsonPatch.apply_patch(
                  modelData.getData(),
                  messageData.patch
                ),
                revision: messageData.revision
              }
            });
          }
          break;
        case META_DATA_MSG_TYPE:
          modelData.set({
            metaData: {
              value: messageData.metaData,
              revision: messageData.revision
            }
          });
          break;
        case USER_EVENT_MSG_TYPE:
          emitter.emit(messageData.eventName, messageData.data);
          break;
        case KEEP_ALIVE_MSG_TYPE:
          break;
        default:
          // eslint-disable-next-line no-console
          console.warn(`Unknown message type: ${messageType}`);
      }
    },

    /**
     * Manage socket disconnection.
     *
     * @return {undefined}
     *
     * @private
     */
    onClose() {
      modelData.set({ modelStatus: { value: DISCONNECTED_STATUS } });
    }
  });

  /**
   * @return {string} The role of this client.
   * @memberof module:reacolo-dev-model~Model#
   */
  const getClientRole = () => modelData.getClientRole();

  /**
   * @return {object} The current state.
   * @memberof module:reacolo-dev-model~Model#
   */
  const getState = () => modelData.getState();

  /**
   * @return {object} The current context.
   * @memberof module:reacolo-dev-model~Model#
   */
  const getContext = () => modelData.getContext();

  /**
   * @return {('connecting'|'ready'|'disconnected'|'error')} The current status.
   * @memberof module:reacolo-dev-model~Model#
   * @see module:reacolo-dev-model.CONNECTING_STATUS
   * @see module:reacolo-dev-model.READY_STATUS
   * @see module:reacolo-dev-model.DISCONNECTED_STATUS
   * @see module:reacolo-dev-model.ERROR_STATUS
   */
  const getModelStatus = () => modelData.getModelStatus();

  /**
   * Register an event listener.
   *
   * Events can be local events sent by the model (i.e.
   * ['reacolo:model:update']{@link module:reacolo-dev-model.MODEL_UPDATE_EVT}),
   * or events broadcasted by the user using
   * {@link module:reacolo-dev-model~Model#broadcastEvent}.
   *
   * @param {string|Symbol} eventName - The name (or symbol) of the event to
   * listen to.
   * @param {function} listener - The listener.
   * @return {undefined}
   *
   * @memberof module:reacolo-dev-model~Model#
   * @see module:reacolo-dev-model~Model#removeListener
   * @see module:reacolo-dev-model~Model#broadcastEvent
   * @see module:reacolo-dev-model.MODEL_UPDATE_EVT
   * @see module:reacolo-dev-model.STATUS_UPDATE_EVT
   *
   * @example
   * model.addListener('reacolo:model:update', modelValue => {
   *   console.log(modelValue);
   * });
   */
  const addListener = emitter.addListener.bind(emitter);

  /**
   * Remove an event listener.
   *
   * @param {string|Symbol} eventName - The name (or symbol) of the event to
   * listen to.
   * @param {function} listener - The listener.
   * @return {undefined}
   *
   * @memberof module:reacolo-dev-model~Model#
   * @see module:reacolo-dev-model~Model#addListener
   */
  const removeListener = emitter.removeListener.bind(emitter);

  /**
   * Patch the server data.
   *
   * @param {object} patch - An [RFC 6902](http://tools.ietf.org/html/rfc6902)
   * compatible patch.
   * @return {Promise} A promise resolved with the new server data once it
   * it has been set.
   * @private
   */
  const patchServer = patch =>
    serverInterface
      .sendRequest(PATCH_DATA_MSG_TYPE, {
        patch,
        from: modelData.getDataRevision()
      })
      .then((resp) => {
        modelData.set({
          data: {
            value: jsonPatch.apply_patch(modelData.getData(), patch),
            revision: resp.revision
          }
        });
        return modelData.getData();
      });

  /**
   * Patch the state.
   *
   * @param {object} patch - An [RFC 6902](http://tools.ietf.org/html/rfc6902)
   * compatible patch.
   * @return {Promise} A promise resolved with the new state once it has been
   * set.
   *
   * @memberof module:reacolo-dev-model~Model#
   *
   * @example
   * model.patchData([
   *   { op: 'add', path: '/a/b/c', value: ['foo', 'bar'] },
   *   { op: 'replace', 'path': '/a/b/c', value: 42 },
   *   { op: 'move', from: '/a/b/c', path: '/a/b/d' },
   *   { op: 'copy', from: '/a/b/d', path: '/a/b/e' }
   * ]).then(state => {
   *   console.log('state', state);
   * });
   */
  const patchState = patch =>
    patchServer(scopePatch('/state', patch)).then(getState);

  /**
   * Patch the context.
   *
   * @param {object} patch - An [RFC 6902](http://tools.ietf.org/html/rfc6902)
   * compatible patch.
   * @return {Promise} A promise resolved with the new context once it has been
   * set.
   *
   * @memberof module:reacolo-dev-model~Model#
   * @see module:reacolo-dev-model~Model#patchState
   */
  const patchContext = patch =>
    patchServer(scopePatch('/context', patch)).then(getContext);

  /**
   * Set the state, entirely overwriting it.
   *
   * @param {object} value - The new state.
   * @return {Promise} A promise resolved with the new state once the state has
   * been set.
   *
   * @memberof module:reacolo-dev-model~Model#
   */
  const setState = value => patchState([{ op: 'add', path: '', value }]);

  /**
   * Set the context, entirely overwriting it.
   *
   * @param {object} value - The new state.
   * @return {Promise} A promise resolved with the new state once the state has
   * been set.
   *
   * @memberof module:reacolo-dev-model~Model#
   */
  const setContext = value => patchContext([{ op: 'add', path: '', value }]);

  /**
   * Set the role of this client.
   * @param {string} role - The target role.
   * @return {Promise} A promise resolved once this client's role has been
   * set.
   */
  const setClientRole = role =>
    serverInterface
      .sendRequest(SET_CLIENT_ROLE_MSG_TYPE, {
        role
      })
      .then(
        ({
          metaData: newMetaData,
          revision: newMetaDataRevision,
          clientRole: newClientRole
        }) => {
          modelData.set({
            clientRole: { value: newClientRole },
            metaData: { value: newMetaData, revision: newMetaDataRevision }
          });
          return modelData.getContext();
        }
      );

  /**
   * Broadcast an event to every connected devices.
   *
   * @param {string} eventName - The name of the event to broadcast.
   * @param {object} eventData - The data of the event.
   * @return {Promise} A promise resolved once the event has been broadcasted
   * and locally emitted.
   *
   * @memberof module:reacolo-dev-model~Model#
   */
  const broadcastEvent = (eventName, eventData) =>
    serverInterface
      .sendRequest(BROADCAST_USER_EVENT_MSG_TYPE, {
        eventName,
        eventData
      })
      .then(() => {
        // Once the event has been sent to the other devices, also emit the event
        // locally.
        emitter.emit(eventName, eventData);
      });

  /**
   * Start the model synchronization.
   *
   * @return {Promise} A promise resolved once the model is started.
   *
   * @memberof module:reacolo-dev-model~Model#
   */
  const start = () =>
    // Start the socket.
    serverInterface
      .start()
      .then(() =>
        Promise.all([
          // If no client roles have been defined we asked the list of roles.
          // Because the set client role request also return the metadata, in
          // the case a role has been defined, we can safely swap this request
          // to the roles request to fetch the roles.
          modelData.getClientRole() == null
            ? serverInterface.sendRequest(GET_META_DATA_MSG_TYPE)
            : serverInterface.sendRequest(SET_CLIENT_ROLE_MSG_TYPE, {
              role: modelData.getClientRole()
            }),
          serverInterface.sendRequest(GET_DATA_MSG_TYPE)
        ])
      )
      .then(([metaDataResponse, dataResponse]) => {
        // Initialize the data.
        modelData.set({
          clientRole: { value: metaDataResponse.clientRole },
          modelStatus: { value: READY_STATUS },
          data: { value: dataResponse.data, revision: dataResponse.revision },
          metaData: {
            value: metaDataResponse.metaData,
            revision: metaDataResponse.revision
          }
        });
      })
      .catch((e) => {
        // In case of an already connect error, we do not alter the status
        // as the model should remain functional. In all other cases,
        // we set the status to error.
        if (!(e instanceof AlreadyConnectedError)) {
          modelData.set({ modelStatus: { value: ERROR_STATUS } });
        }
        throw e;
      });

  /**
   * @interface module:reacolo-dev-model~Model
   */
  return {
    getClientRole,
    getState,
    getContext,
    getModelStatus,
    addListener,
    removeListener,
    patchState,
    patchContext,
    setState,
    setContext,
    setClientRole,
    broadcastEvent,
    start
  };
};
