import SockJS from 'sockjs-client';
import EventEmitter from 'eventemitter3';
import { ExtendableError } from '../utils';

const DEFAULT_ACK_TIMEOUT = 20000;
const DEFAULT_SERVER_ADDR = `http://${location.host}/socket`;

const timedOut = async (prom, delay, ...rejectArgs) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(...rejectArgs), delay);
  prom.then((...args) => {
    clearTimeout(timeout);
    resolve(...args);
  });
});

class RequestFailedException extends ExtendableError {}
class NotConnectedException extends RequestFailedException {}
class RequestTimeoutException extends RequestFailedException {}

class ReacoloDirtyModelSync extends EventEmitter {

  constructor(serverAddress = DEFAULT_SERVER_ADDR, role, ackTimeout = DEFAULT_ACK_TIMEOUT) {
    super();

    // Delay for the server to acknowledge a request.
    this.ackTimeout = ackTimeout;

    // Init the values.
    this._serverAddress = serverAddress;
    this._context = { roleAssignations: {}, observers: 0, role };
    this._appData = null;
    this._isConnected = false;
  }

  async setAppData(appData) {
    if (!this.isConnected) {
      throw new NotConnectedException('Model sync not connected');
    }
    await this._socketSend('set_app_data', appData);
    this._appData = appData;
    this.emit(ReacoloDirtyModelSync.DATA_UPDATE, this._appData, false);
    return appData;
  }

  async setRole(role) {
    if (!this.isConnected) {
      throw new NotConnectedException('Model sync not connected');
    }
    await this._socketSend('set_socket_role', role);
    this._context = Object.assign({}, this._context, { role });
    this.emit(ReacoloDirtyModelSync.CONTEXT_UPDATE, this._context, false);
    return this._context;
  }

  get role() {
    return this._context.role;
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
    if (this.isConnected) {
      throw new Error('Already connected');
    }
    try {
      // Start the socket.
      this._socket = await ReacoloDirtyModelSync._openSocket(this._serverAddress);

      // Bind the handlers.
      this._socket.onmessage = this._onSocketMessage.bind(this);
      this._socket.onclose = this._onSocketClose.bind(this);

      // Synchronize the data with the server.
      const [role, appData, metaData] = await Promise.all([
        // If no role has been defined default the role promise is just resolved to undefined.
        this._context.role == null ? undefined : (
          this._socketSend('set_socket_role', this._context.role).then(() => this._context.role)
        ),
        this._socketSend('app_data_request'),
        this._socketSend('meta_data_request')
      ]);
      this._appData = appData;
      this._context = Object.assign({}, this._context, metaData, { role });
      this._isConnected = true;

      // Notify observers.
      this.emit(ReacoloDirtyModelSync.CONNECTED);
    } catch (e) {
      this._isConnected = false;
      this.emit(ReacoloDirtyModelSync.CONNECTION_ERROR, e);
      throw e;
    }
  }

  _onSocketMessage(originalMessage) {
    const message = JSON.parse(originalMessage.data);
    switch (message.type) {
      case 'app_data':
        this._appData = message.data;
        this.emit(ReacoloDirtyModelSync.DATA_UPDATE, this._appData, true);
        break;
      case 'meta_data':
        this._context = Object.assign({}, this._context, message.data);
        this.emit(ReacoloDirtyModelSync.CONTEXT_UPDATE, this._context, true);
        break;
      case 'ack':
        ReacoloDirtyModelSync._handleAckMessage(message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  _onSocketClose() {
    this._isConnected = false;
    this.emit(ReacoloDirtyModelSync.DISCONNECTED);
  }

  async _socketSend(type, data) {
    // Fetch the message id.
    const msgId = ReacoloDirtyModelSync._getNextMessageId();
    // Get the corresponding acknowledgement promise.
    const ackPromise = ReacoloDirtyModelSync._waitForAck(msgId);
    // Create the request and send it.
    const request = { type, data, id: msgId };
    this._socket.send(JSON.stringify(request));
    // Wait for a response for _ACK_TIMEOUT ms.
    const serverResponse = await timedOut(ackPromise, this.ackTimeout)
      .catch(() => {
        throw new RequestTimeoutException(`Request time out (${request.type}).`);
      });
    // If the request is a success, return the response.
    if (serverResponse.success) {
      return serverResponse.response;
    }
    // Else throw the response.
    throw new RequestFailedException(serverResponse.response);
  }

  static async _openSocket(address) {
    return new Promise((resolve) => {
      const socket = new SockJS(address);
      socket.onopen = () => resolve(socket);
    });
  }

  static async _waitForAck(messageId) {
    const response = await new Promise((resolve) => {
      ReacoloDirtyModelSync._ackCallbacks.set(messageId, resolve);
    });
    ReacoloDirtyModelSync._ackCallbacks.delete(messageId);
    return response;
  }

  static _handleAckMessage(ackMessage) {
    if (ReacoloDirtyModelSync._ackCallbacks.has(ackMessage.data.messageId)) {
      (ReacoloDirtyModelSync._ackCallbacks.get(ackMessage.data.messageId))(ackMessage.data);
    } else {
      console.error(`Unexpected acknowledgement for message: ${ackMessage.data.messageId}`);
    }
  }

  static _getNextMessageId() {
    const msgId = ReacoloDirtyModelSync._nextMessageId;
    ReacoloDirtyModelSync._nextMessageId += 1;
    return msgId;
  }
}

// List of the events.
ReacoloDirtyModelSync.CONNECTED = Symbol.for('connected');
ReacoloDirtyModelSync.DISCONNECTED = Symbol.for('disconnected');
ReacoloDirtyModelSync.DATA_UPDATE = Symbol.for('data:update');
ReacoloDirtyModelSync.CONTEXT_UPDATE = Symbol.for('context:update');
ReacoloDirtyModelSync.CONNECTION_ERROR = Symbol.for('connection:error');

ReacoloDirtyModelSync.RequestFailedException = RequestFailedException;
ReacoloDirtyModelSync.NotConnectedException = NotConnectedException;
ReacoloDirtyModelSync.RequestTimeoutException = ReacoloDirtyModelSync;

// "Protected" static members.
ReacoloDirtyModelSync._nextMessageId = 0;
ReacoloDirtyModelSync._ackCallbacks = new Map();

// We need to use commonjs here as webpack does not works with export default.
export default ReacoloDirtyModelSync;
