/**
 * @module reacolo-dev-model/model
 * @private
 */

import EventEmitter from 'eventemitter3';
import { apply_patch as jsonPatch } from 'jsonpatch';
import jsonMergePatch from 'tiny-merge-patch';
import mergeRequest from './merge-requests.js';
import scopePatch from './scope-patch.js';
import { MODEL_UPDATE_EVT } from './constants/events.js';
import {
  CONNECTING_STATUS,
  READY_STATUS,
  DISCONNECTED_STATUS,
  ERROR_STATUS,
} from './constants/status.js';
import { AlreadyConnectedError } from './constants/errors.js';

/**
 * Server Interface factory.
 * @callback CreateServerInterface
 * @param {module:reacolo-dev-model~ServerInterfaceHandlers} handlers - The
 * server interface's handlers.
 * @return {module:reacolo-dev-model~ServerInterface}
 */

/**
 * Creates a ReacoloDevModel.
 *
 * Technically, this function, bridges the server interface and the model
 * data, and exposes an API for both.
 *
 * @param {module:reacolo-dev-model/model~CreateServerInterface}
 * createServerInterface - Server interface factory.
 * @param {module:reacolo-dev-model/model-data} createModelData - Model data
 * factory.
 * @param {string} [initRole] - The initial client role.
 * @return {module:reacolo-dev-model~Model} The model.
 * @private
 */
export default (createServerInterface, createModelData, initRole) => {
  /**
   * Manage the model's event.
   * @private
   */
  const emitter = new EventEmitter();

  /**
   * Store the data and manage the model's context and store.
   * @type {module:reacolo-dev-model~ModelData}
   * @private
   */
  const modelData = createModelData({
    initRole,
    initModelStatus: CONNECTING_STATUS,
    onUpdate(modelValue) {
      emitter.emit(MODEL_UPDATE_EVT, modelValue, true);
    },
  });

  /**
   * Request the current data revision from the server and updates it.
   * @private
   * @func
   * @param {module:reacolo-dev-model~ServerInterface} serverInterface - The
   * server interface to use.
   * @return {Promise<undefined>} A promise resolved once the data has been set.
   */
  const updateDataFromServer = serverInterface =>
    serverInterface.getData().then(resp => {
      modelData.set({
        data: { value: resp.data, revision: resp.revision },
      });
    });

  /**
   * The interface to communicate with the server.
   * @type {module:reacolo-dev-model~ServerInterface}
   * @private
   */
  const serverInterface = createServerInterface({
    mergeRequest,
    onDataUpdate(data, revision) {
      modelData.set({ data: { value: data, revision } });
    },
    onDataPatch(from, patch, revision) {
      if (modelData.getDataRevision() !== from) {
        // If the patch is applied on a revision different from the current
        // revision, we do not apply the patch and instead ask the server
        // for a full data update.
        // eslint-disable-next-line no-console
        console.warn(
          `Received a data patch from unknown revision: ${from} (current is ${modelData.getDataRevision()}). Requesting a full data update.`,
        );
        updateDataFromServer(serverInterface);
      } else {
        modelData.set({
          data: {
            value: jsonPatch(modelData.getData(), patch),
            revision,
          },
        });
      }
    },
    onDataMergePatch(from, mergePatch, revision) {
      if (modelData.getDataRevision() !== from) {
        // Same as above.
        // eslint-disable-next-line no-console
        console.warn(
          `Received a data merge patch from unknown revision: ${from} (current is ${modelData.getDataRevision()}). Requesting a full data update.`,
        );
        updateDataFromServer(serverInterface);
      } else {
        modelData.set({
          data: {
            value: jsonMergePatch(modelData.getData(), mergePatch),
            revision,
          },
        });
      }
    },
    onMetaDataUpdate(metaData, revision) {
      modelData.set({
        metaData: {
          value: metaData,
          revision,
        },
      });
    },
    onUserEvent(eventName, eventData) {
      emitter.emit(eventName, eventData);
    },
    onDisconnected() {
      modelData.set({ status: { value: DISCONNECTED_STATUS } });
    },
  });

  /**
   * @return {string} The role of this client.
   * @memberof module:reacolo-dev-model~Model#
   */
  const getRole = () => modelData.getRole();

  /**
   * @return {object} The current store.
   * @memberof module:reacolo-dev-model~Model#
   */
  const getStore = () => modelData.getStore();

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
  const getStatus = () => modelData.getStatus();

  /**
   * Register an event listener.
   *
   * Events can be local events sent by the model (i.e.
   * ['reacolo:model:update']{@link module:reacolo-dev-model.MODEL_UPDATE_EVT}),
   * or events broadcasted by the user using
   * {@link module:reacolo-dev-model~Model#broadcastEvent}.
   *
   * @func
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
   * @func
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
  const patchData = patch =>
    serverInterface.patchData(modelData.getDataRevision(), patch).then(resp => {
      modelData.set({
        data: {
          value: jsonPatch(modelData.getData(), patch),
          revision: resp.revision,
        },
      });
      return modelData.getData();
    });

  /**
   * Merge the server data.
   *
   * @param {object} mergePatch - An [RFC 7396](https://tools.ietf.org/html/rfc7396)
   * compatible patch.
   * @return {Promise} A promise resolved with the new server data once it
   * it has been set.
   * @private
   */
  const mergeData = mergePatch =>
    serverInterface
      .mergePatchData(modelData.getDataRevision(), mergePatch)
      .then(resp => {
        modelData.set({
          data: {
            value: jsonMergePatch(modelData.getData(), mergePatch),
            revision: resp.revision,
          },
        });
        return modelData.getData();
      });

  /**
   * Patch the store.
   *
   * @param {object} patch - An [RFC 6902](http://tools.ietf.org/html/rfc6902)
   * compatible patch.
   * @return {Promise} A promise resolved with the new store once it has been
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
   * ]).then(store => {
   *   console.log('store', store);
   * });
   */
  const patchStore = patch =>
    patchData(scopePatch('/store', patch)).then(getStore);

  /**
   * Merge the store.
   *
   * @param {object} mergePatch - An [RFC 7396](http://tools.ietf.org/html/rfc7396)
   * compatible patch.
   * @return {Promise} A promise resolved with the new store once it has been
   * set.
   *
   * @memberof module:reacolo-dev-model~Model#
   *
   * @example
   * model.mergeStore({
   *   a: { a1: 3 }
   * }).then(store => {
   *   console.log('store', store);
   * });
   */
  const mergeStore = mergePatch =>
    mergeData({ store: mergePatch }).then(getStore);

  /**
   * Patch the context.
   *
   * @param {object} patch - An [RFC 6902](http://tools.ietf.org/html/rfc6902)
   * compatible patch.
   * @return {Promise} A promise resolved with the new context once it has been
   * set.
   *
   * @memberof module:reacolo-dev-model~Model#
   * @see module:reacolo-dev-model~Model#patchStore
   */
  const patchContext = patch =>
    patchData(scopePatch('/context', patch)).then(getContext);

  /**
   * Merge the context.
   *
   * @param {object} mergePatch - An [RFC 7396](http://tools.ietf.org/html/rfc7396)
   * compatible patch.
   * @return {Promise} A promise resolved with the new store once it has been
   * set.
   *
   * @memberof module:reacolo-dev-model~Model#
   */
  const mergeContext = mergePatch =>
    mergeData({ context: mergePatch }).then(getStore);

  /**
   * Set the store, entirely overwriting it.
   *
   * @param {object} value - The new store.
   * @return {Promise} A promise resolved with the new store once the store has
   * been set.
   *
   * @memberof module:reacolo-dev-model~Model#
   */
  const setStore = value => patchStore([{ op: 'add', path: '', value }]);

  /**
   * Set the context, entirely overwriting it.
   *
   * @param {object} value - The new store.
   * @return {Promise} A promise resolved with the new store once the store has
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
  const setRole = role =>
    serverInterface
      .setClientRole(role)
      .then(
        ({
          metaData: newMetaData,
          revision: newMetaDataRevision,
          clientRole: newRole,
        }) => {
          modelData.set({
            role: { value: newRole },
            metaData: { value: newMetaData, revision: newMetaDataRevision },
          });
          return modelData.getContext();
        },
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
    serverInterface.broadcastEvent(eventName, eventData).then(() => {
      // Once the event has been sent to the other devices, also emit the event
      // locally.
      emitter.emit(eventName, eventData);
    });

  /**
   * Start the model synchronization.
   *
   * @return {Promise<undefined>} A promise resolved once the model is started.
   *
   * @memberof module:reacolo-dev-model~Model#
   */
  const start = () =>
    // Start the socket.
    serverInterface
      .connect()
      .then(() =>
        Promise.all([
          // If no client roles have been defined we asked the list of roles.
          // Because the set client role request also return the metadata, in
          // the case a role has been defined, we can safely swap this request
          // to the roles request to fetch the roles.
          modelData.getRole() == null
            ? serverInterface.getMetaData()
            : serverInterface.setClientRole(modelData.getRole()),
          serverInterface.getData(),
        ]),
      )
      .then(([metaDataResponse, dataResponse]) => {
        // Initialize the data.
        modelData.set({
          role: { value: metaDataResponse.clientRole },
          status: { value: READY_STATUS },
          data: { value: dataResponse.data, revision: dataResponse.revision },
          metaData: {
            value: metaDataResponse.metaData,
            revision: metaDataResponse.revision,
          },
        });
      })
      .catch(e => {
        // In case of an already connect error, we do not alter the status
        // as the model should remain functional. In all other cases,
        // we set the status to error.
        if (!(e instanceof AlreadyConnectedError)) {
          modelData.set({ status: { value: ERROR_STATUS } });
        }
        throw e;
      });

  /**
   * @interface module:reacolo-dev-model~Model
   */
  return {
    getRole,
    getStore,
    getContext,
    getStatus,
    addListener,
    removeListener,
    patchStore,
    patchContext,
    mergeStore,
    mergeContext,
    setStore,
    setContext,
    setRole,
    broadcastEvent,
    start,
  };
};
