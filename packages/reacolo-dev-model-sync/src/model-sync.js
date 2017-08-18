import EventEmitter from 'eventemitter3';
import ReacoloSocket from './reacolo-socket.js';
import * as MessageTypes from './message-types.js';
import * as Errors from './errors.js';
import * as Events from './events.js';
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
      this.constructor._mergeRequest,
      requestTimeout,
      requestThrottle
    );

    // Init the values.
    this._context = { roles: {}, observers: 0, clientRole };
    this._appData = null;

    // Create the event broadcaster (behind the scene, it uses an internal event emitter).
    const broadcastEmitter = new EventEmitter();
    const eventBroadcaster = Object.freeze({
      publish: (eventName, data) => {
        this._broadcastEvent(eventName, data);
      },
      subscribe(eventName, listener) {
        broadcastEmitter.addListener(eventName, listener.bind());
      },
      unsubscribe(eventName, listener) {
        broadcastEmitter.removeListener(eventName, listener.bind());
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
    await this._socket.sendRequest(MessageTypes.SET_APP_DATA_MSG_TYPE, appData);
    this._appData = appData;
    this.emit(Events.DATA_UPDATE, this._appData, false);
    return appData;
  }

  async setMetaData(metaData) {
    const response = await this._socket.sendRequest(MessageTypes.SET_META_DATA_MSG_TYPE, metaData);
    this._context = Object.assign({}, response, { clientRole: this._context.clientRole });
    this.emit(Events.CONTEXT_UPDATE, this._context, true);
    return this._context;
  }

  async setClientRole(clientRole) {
    await this._socket.sendRequest(MessageTypes.SET_CLIENT_ROLE_MSG_TYPE, clientRole);
    this._context = Object.assign({}, this._context, { clientRole });
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
      const [clientRole, appData, metaData] = await Promise.all([
        // If no role has been defined default the role promise is just resolved to undefined.
        this._context.clientRole == null ? undefined : (
          this._socket.sendRequest(MessageTypes.SET_CLIENT_ROLE_MSG_TYPE, this._context.clientRole)
        ),
        this._socket.sendRequest(MessageTypes.APP_DATA_REQUEST_MSG_TYPE),
        this._socket.sendRequest(MessageTypes.CONTEXT_REQUEST_MSG_TYPE)
      ]);
      this._appData = appData;
      this._context = Object.assign({}, metaData, { clientRole });
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
        this._appData = message.data;
        this.emit(Events.DATA_UPDATE, this._appData, true);
        break;
      case MessageTypes.CONTEXT_MSG_TYPE:
        this._context = Object.assign({}, message.data, { clientRole: this._context.clientRole });
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

  static _mergeRequest(request1, request2) {
    // Currently, no 2 different requests can be merged.
    if (request1.type === request2.type) {
      switch (request1.type) {
        // These requests are single shot: only the last one matters.
        // Hence we replace any pending request with the new one.
        case MessageTypes.SET_APP_DATA_MSG_TYPE:
        case MessageTypes.SET_CLIENT_ROLE_MSG_TYPE:
        case MessageTypes.APP_DATA_REQUEST_MSG_TYPE:
        case MessageTypes.CONTEXT_REQUEST_MSG_TYPE:
          // Create the new request.
          return request2;
        // By default it is safer not to merge.
        default:
      }
    }
    return undefined;
  }
}

// Inject the Errors and the Events as static members of ReacoloModelSync.
Object.assign(ReacoloModelSync, Errors, Events);
