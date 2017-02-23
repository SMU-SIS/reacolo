import EventEmitter from 'eventemitter3';
import ReacoloSocket from './reacolo-socket';
import * as MessageTypes from './message-types';
import * as Errors from './errors';
import * as Events from './events';
import { DEFAULT_SERVER_ADDR } from './defaults';

export default class ReacoloModelSync extends EventEmitter {

  constructor(serverAddress = DEFAULT_SERVER_ADDR, clientRole) {
    super();

    // Create the connection toward the server.
    this._socket = new ReacoloSocket(serverAddress, this.constructor._mergeRequest);

    // Init the values.
    this._context = { roles: {}, observers: 0, clientRole };
    this._appData = null;

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
    await this._socket.sendRequest(MessageTypes.SET_SOCKET_ROLE_MSG_TYPE, clientRole);
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
          this._socket.sendRequest(MessageTypes.SET_SOCKET_ROLE_MSG_TYPE, this._context.clientRole)
        ),
        this._socket.sendRequest(MessageTypes.APP_DATA_REQUEST_MSG_TYPE),
        this._socket.sendRequest(MessageTypes.META_DATA_REQUEST_MSG_TYPE)
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

  _onSocketMessage(message) {
    switch (message.type) {
      case MessageTypes.APP_DATA_MSG_TYPE:
        this._appData = message.data;
        this.emit(Events.DATA_UPDATE, this._appData, true);
        break;
      case MessageTypes.METADATA_MSG_TYPE:
        this._context = Object.assign({}, message.data, { clientRole: this._context.clientRole });
        this.emit(Events.CONTEXT_UPDATE, this._context, true);
        break;
      default:
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
        // This requests are just replaced by a new one.
        // Only the callback is modified.
        case MessageTypes.SET_APP_DATA_MSG_TYPE:
        case MessageTypes.SET_SOCKET_ROLE_MSG_TYPE:
        case MessageTypes.APP_DATA_REQUEST_MSG_TYPE:
        case MessageTypes.META_DATA_REQUEST_MSG_TYPE:
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
