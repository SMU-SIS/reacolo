import EventEmitter from 'eventemitter3';
import jsonPatch from 'jsonpatch';
import ReacoloSocket from './reacolo-socket.js';
import * as MessageTypes from './message-types.js';
import * as Errors from './errors.js';
import * as Events from './events.js';
import mergeRequest from './merge-requests.js';
import { DEFAULT_SERVER_ADDR, DEFAULT_THROTTLE, DEFAULT_ACK_TIMEOUT } from './defaults.js';

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
    this._context = { roles: {}, observers: 0, clientRole };
    this._appData = null;
    this._appDataRevision = -1;
    this._metaDataRevision = -1;

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

    this._isConnected = false;
  }

  async setAppData(appData) {
    const resp = await this._socket.sendRequest(
      MessageTypes.SET_APP_DATA_MSG_TYPE,
      { appData, from: this._appDataRevision }
    );
    this._appDataRevision = resp.revision;
    this._appData = appData;
    this.emit(Events.DATA_UPDATE, this._appData, false);
    return appData;
  }

  async patchAppData(patch) {
    const resp = await this._socket.sendRequest(
      MessageTypes.PATCH_DATA_MSG_TYPE,
      { patch, from: this._appDataRevision }
    );
    this._appDataRevision = resp.revision;
    this._appData = jsonPatch.apply_patch(this._appData, patch);
    this.emit(Events.DATA_UPDATE, this._appData, false);
    return this._appData;
  }

  async setMetaData(metaData) {
    const { revision } = await this._socket.sendRequest(
      MessageTypes.SET_META_DATA_MSG_TYPE,
      { metaData, from: this._metaDataRevision }
    );
    this._metaDataRevision = revision;
    this._context = Object.assign({}, this._context, metaData, {
      // Make sure these properties are not overwriten.
      clientRole: this._context.clientRole,
      roles: this._context.roles,
      observers: this._context.observers
    });
    this.emit(Events.CONTEXT_UPDATE, this._context, true);
    return this._context;
  }

  async setClientRole(role) {
    const { roles, clientRole } = await this._socket.sendRequest(
      MessageTypes.SET_CLIENT_ROLE_MSG_TYPE,
      { role }
    );
    this._context = Object.assign({}, this._context, { clientRole, roles });
    this.emit(Events.CONTEXT_UPDATE, this._context, false);
    return this._context;
  }

  get clientRole() {
    return this._context.clientRole;
  }

  get data() {
    return this._appData;
  }

  get context() {
    return this._context;
  }

  get isConnected() {
    return this._isConnected;
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
        { roles, observers, clientRole },
        { appData, revision: appDataRevision },
        { metaData, revision: metaDataRevision }
      ] = await Promise.all([
        // If no client roles have been defined we asked the list of roles.
        // Because the set client role request also return the roles and
        // observers properties, in the case a role has been defined, we can
        // safely swap this request to the roles request to fetch the roles.
        this._context.clientRole == null ? (
          this._socket.sendRequest(MessageTypes.ROLES_REQUEST_MSG_TYPE)
        ) : (
          this._socket.sendRequest(MessageTypes.SET_CLIENT_ROLE_MSG_TYPE, {
            role: this._context.clientRole
          })
        ),
        this._socket.sendRequest(MessageTypes.APP_DATA_REQUEST_MSG_TYPE),
        this._socket.sendRequest(MessageTypes.META_DATA_REQUEST_MSG_TYPE)
      ]);
      this._appData = appData;
      this._appDataRevision = appDataRevision;
      this._context = Object.assign({}, metaData, { clientRole, roles, observers });
      this._metaDataRevision = metaDataRevision;
      this._isConnected = true;

      // Notify observers.
      this.emit(Events.CONNECTED);
    } catch (e) {
      if (e instanceof Errors.AlreadyConnectedError) {
        this._isConnected = false;
        this.emit(Events.CONNECTION_ERROR, e);
      }
      throw e;
    }
  }

  // TODO: stop.

  async _broadcastEvent(eventName, data) {
    await this._socket.sendRequest(MessageTypes.BROADCAST_USER_EVENT_MSG_TYPE, {
      eventName,
      data
    });
    this._publishBroadcastedEvent(eventName, data);
  }

  _onSocketMessage(message) {
    switch (message.type) {
      case MessageTypes.APP_DATA_MSG_TYPE:
        this._appData = message.data.appData;
        this._appDataRevision = message.data.revision;
        this.emit(Events.DATA_UPDATE, this._appData, true);
        break;
      case MessageTypes.APP_DATA_PATCH_MSG_TYPE:
        if (this._appDataRevision !== message.data.from) {
          // If the patch is applied on a revision different from the current
          // revision, we do not apply the patch and instead ask the server
          // for a full data update.
          // eslint-disable-next-line no-console
          console.warn(
            `Received an app data patch from unknown revision: ${message.data.from} (current is ${this._appDataRevision}). Requesting a full data update.`
          );
          this._socket.sendRequest(MessageTypes.APP_DATA_REQUEST_MSG_TYPE);
        } else {
          this._appData = jsonPatch.apply_patch(this._appData, message.data.patch);
          this._appDataRevision = message.data.revision;
          this.emit(Events.DATA_UPDATE, this._appData, true);
        }
        break;
      case MessageTypes.META_DATA_MSG_TYPE:
        this._context = Object.assign(
          {},
          message.data.metaData,
          // clientRole and roles are part of the context, but not part of
          // the metaData.
          { clientRole: this._context.clientRole, roles: this._context.roles }
        );
        this._metaDataRevision = message.data.revision;
        this.emit(Events.CONTEXT_UPDATE, this._context, true);
        break;
      case MessageTypes.ROLES_MSG_TYPE:
        this._context = Object.assign(
          {},
          this._context,
          { roles: message.data.roles, observers: message.data.observers }
        );
        this.emit(Events.CONTEXT_UPDATE, this._context, true);
        break;
      case MessageTypes.USER_EVENT_MSG_TYPE:
        this._publishBroadcastedEvent(message.data.eventName, message.data.data);
        break;
      case MessageTypes.KEEP_ALIVE_MSG_TYPE:
        break;
      default:
        // eslint-disable-next-line no-console
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  _onSocketClose() {
    this._isConnected = false;
    this.emit(Events.DISCONNECTED);
  }
}

// Inject the Errors and the Events as static members of ReacoloModelSync.
Object.assign(ReacoloModelSync, Errors, Events);
