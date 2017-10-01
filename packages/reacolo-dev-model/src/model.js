import EventEmitter from 'eventemitter3';
import jsonPatch from 'jsonpatch';
import ReacoloSocket from './reacolo-socket.js';
import mergeRequest from './merge-requests.js';
import { AlreadyConnectedError } from './errors';
import {
  SET_DATA_MSG_TYPE,
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
} from './message-types.js';
import {
  DATA_UPDATE_EVT,
  META_DATA_UPDATE_EVT,
  STATUS_UPDATE_EVT,
  CLIENT_ROLE_UPDATE_EVT
} from './events.js';
import {
  DEFAULT_SERVER_ADDR,
  DEFAULT_THROTTLE,
  DEFAULT_ACK_TIMEOUT
} from './defaults.js';

const CONNECTING_STATUS = 'connecting';
const CONNECTED_STATUS = 'connected';
const DISCONNECTED_STATUS = 'disconnected';
const ERROR_STATUS = 'error';

export default class ReacoloModelSync extends EventEmitter {
  constructor(
    serverAddress = DEFAULT_SERVER_ADDR,
    clientRole,
    {
      requestThrottle = DEFAULT_THROTTLE,
      requestTimeout = DEFAULT_ACK_TIMEOUT
    } = {}
  ) {
    super();

    // Create the connection toward the server.
    this._socket = new ReacoloSocket(
      serverAddress,
      mergeRequest,
      requestTimeout,
      requestThrottle
    );

    // Init the values.
    this._data = null;
    this._dataRevision = -1;
    this._metaData = null;
    this._metaDataRevision = -1;
    this._clientRole = clientRole;
    this._status = CONNECTING_STATUS;

    // Create the event broadcaster (behind the scene, it uses an internal event emitter).
    const broadcastEmitter = new EventEmitter();
    const eventBroadcaster = Object.freeze({
      publish: (eventName, data) => {
        this._broadcastEvent(eventName, data);
      },
      subscribe(eventName, listener, context) {
        broadcastEmitter.addListener(eventName, listener, context);
      },
      unsubscribe(eventName, listener, context) {
        broadcastEmitter.removeListener(eventName, listener, context);
      }
    });

    // Set up the event broadcaster as a read only property.
    Object.defineProperty(this, 'eventBroadcaster', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: eventBroadcaster
    });

    // Method to locally publish the events.
    this._publishBroadcastedEvent = (...args) => broadcastEmitter.emit(...args);
  }

  async setData(data) {
    const resp = await this._socket.sendRequest(SET_DATA_MSG_TYPE, {
      data,
      from: this._dataRevision
    });
    this._dataRevision = resp.revision;
    this._data = data;
    this.emit(DATA_UPDATE_EVT, this._data, false);
    return data;
  }

  async patchData(patch) {
    const resp = await this._socket.sendRequest(PATCH_DATA_MSG_TYPE, {
      patch,
      from: this._dataRevision
    });
    this._dataRevision = resp.revision;
    this._data = jsonPatch.apply_patch(this._data, patch);
    this.emit(DATA_UPDATE_EVT, this._data, false);
    return this._data;
  }

  async setClientRole(role) {
    const {
      metaData,
      revision,
      clientRole
    } = await this._socket.sendRequest(SET_CLIENT_ROLE_MSG_TYPE, {
      role
    });
    this._clientRole = clientRole;
    this.emit(CLIENT_ROLE_UPDATE_EVT, this._clientRole);
    this._metaData = metaData;
    this._metaDataRevision = revision;
    this.emit(META_DATA_UPDATE_EVT, this._metaData);
    return this._metaData;
  }

  get clientRole() {
    return this._clientRole;
  }

  get data() {
    return this._data;
  }

  get metaData() {
    return this._metaData;
  }

  get status() {
    return this._status;
  }

  async start() {
    try {
      // Start the socket.
      await this._socket.start();

      // Connect the message handler.
      this._socket.onmessage = this._onSocketMessage.bind(this);
      this._socket.onclose = this._onSocketClose.bind(this);

      // Synchronize the data with the server.
      const [
        { metaData, revision: metaDataRevision, clientRole },
        { data, revision: dataRevision }
      ] = await Promise.all([
        // If no client roles have been defined we asked the list of roles.
        // Because the set client role request also return the metadata, in the
        // case a role has been defined, we can safely swap this request to the
        // roles request to fetch the roles.
        this._clientRole == null
          ? this._socket.sendRequest(GET_META_DATA_MSG_TYPE)
          : this._socket.sendRequest(SET_CLIENT_ROLE_MSG_TYPE, {
            role: this._clientRole
          }),
        this._socket.sendRequest(GET_DATA_MSG_TYPE)
      ]);

      this._data = data;
      this._dataRevision = dataRevision;
      this._clientRole = clientRole;
      this._metaData = metaData;
      this._metaDataRevision = metaDataRevision;
      this._status = CONNECTED_STATUS;

      // Notify observers.
      this.emit(STATUS_UPDATE_EVT, this._status);
    } catch (e) {
      if (!(e instanceof AlreadyConnectedError)) {
        this._status = ERROR_STATUS;
        this.emit(STATUS_UPDATE_EVT, this._status);
      }
      throw e;
    }
  }

  // TODO: stop.

  async _broadcastEvent(eventName, data) {
    await this._socket.sendRequest(BROADCAST_USER_EVENT_MSG_TYPE, {
      eventName,
      data
    });
    this._publishBroadcastedEvent(eventName, data);
  }

  _onSocketMessage(type, data) {
    switch (type) {
      case DATA_MSG_TYPE:
        this._data = data.data;
        this._dataRevision = data.revision;
        this.emit(DATA_UPDATE_EVT, this._data, true);
        break;
      case DATA_PATCH_MSG_TYPE:
        if (this._dataRevision !== data.from) {
          // If the patch is applied on a revision different from the current
          // revision, we do not apply the patch and instead ask the server
          // for a full data update.
          // eslint-disable-next-line no-console
          console.warn(
            `Received an app data patch from unknown revision: ${data.from} (current is ${this
              ._dataRevision}). Requesting a full data update.`
          );
          this._socket.sendRequest(GET_DATA_MSG_TYPE);
        } else {
          this._data = jsonPatch.apply_patch(this._data, data.patch);
          this._dataRevision = data.revision;
          this.emit(DATA_UPDATE_EVT, this._data, true);
        }
        break;
      case META_DATA_MSG_TYPE:
        this._metaData = data.metaData;
        this._metaDataRevision = data.revision;
        this.emit(META_DATA_UPDATE_EVT, this._metaData, true);
        break;
      case USER_EVENT_MSG_TYPE:
        this._publishBroadcastedEvent(data.eventName, data.data);
        break;
      case KEEP_ALIVE_MSG_TYPE:
        break;
      default:
        // eslint-disable-next-line no-console
        console.warn(`Unknown message type: ${type}`);
    }
  }

  _onSocketClose() {
    this._status = DISCONNECTED_STATUS;
    this.emit(STATUS_UPDATE_EVT, this._status);
  }
}

// Inject the Errors and the Events as static members of ReacoloModelSync.
Object.assign(ReacoloModelSync, {
  AlreadyConnectedError,
  DATA_UPDATE_EVT,
  META_DATA_UPDATE_EVT,
  STATUS_UPDATE_EVT,
  CLIENT_ROLE_UPDATE_EVT,
  CONNECTING_STATUS,
  CONNECTED_STATUS,
  DISCONNECTED_STATUS,
  ERROR_STATUS
});
