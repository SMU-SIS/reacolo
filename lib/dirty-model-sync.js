import SockJS from 'sockjs-client';
import EventEmitter from 'eventemitter3';

class ReacoloDirtyModelSync extends EventEmitter {

  constructor(serverAddress = `http://${location.host}${ReacoloDirtyModelSync._PREFIX}`, role) {
    super();

    this._context = { roleAssignations: {}, observer: 0, role };
    this._appData = null;
    this._isConnected = false;

    this._socket = new SockJS(serverAddress);
    this._socket.onmessage = this._onSocketMessage.bind(this);
    this._socket.onopen = this._onSocketOpen.bind(this);
    this._socket.onclose = this._onSocketClose.bind(this);
  }

  async setAppData(appData) {
    await this._socketSend('set_app_data', appData);
    this._appData = appData;
    setTimeout(() => this.emit(ReacoloDirtyModelSync.DATA_UPDATE, this._appData));
    return appData;
  }

  async setRole(role) {
    await this._socketSend('set_socket_role', role);
    this._context = Object.assign({}, this._context, { role });
    setTimeout(() => this.emit(ReacoloDirtyModelSync.CONTEXT_UPDATE, this._context));
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

  _newRole(role) {
    this._context = Object.assign({}, this._context, { role });
    this.emit(ReacoloDirtyModelSync.CONTEXT_UPDATE, this._context);
  }

  async _syncDataWithServer() {
    this._appData = await this._socketSend('app_data_request');
  }

  async _syncContextWithServer() {
    const metaData = await this._socketSend('meta_data_request');
    this._context = Object.assign({}, this._context, metaData);
  }

  async _onSocketOpen() {
    try {
      await Promise.all([
        this._role ? this._socketSend('set_socket_role', this._role) : undefined,
        this._syncDataWithServer(),
        this._syncContextWithServer()
      ]);
      this._isConnected = true;
      this.emit(ReacoloDirtyModelSync.CONNECTED);
    } catch (e) {
      this._isConnected = false;
      setTimeout(() => this.emit(ReacoloDirtyModelSync.CONNECTION_ERROR));
      throw e;
    }
  }

  _onSocketMessage(originalMessage) {
    const message = JSON.parse(originalMessage.data);
    switch (message.type) {
      case 'app_data':
        this._appData = message.data;
        this.emit(ReacoloDirtyModelSync.DATA_UPDATE, this._appData);
        break;
      case 'meta_data':
        this._context = Object.assign({}, this._context, message.data);
        this.emit(ReacoloDirtyModelSync.CONTEXT_UPDATE, this._context);
        break;
      case 'ack':
        if (ReacoloDirtyModelSync._ackCallbacks.has(message.data.messageId)) {
          (ReacoloDirtyModelSync._ackCallbacks.get(message.data.messageId))(message.data);
        } else {
          console.error(`Unexpected acknowledgement for message: ${message.data.messageId}`);
        }
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
    const { success, response, messageId } = await new Promise((resolve, reject) => {
      const msgId = ReacoloDirtyModelSync._nextMessageId;
      ReacoloDirtyModelSync._nextMessageId += 1;
      // Set up a time out for the reception of the acknowledgement.
      const timeout = setTimeout(() => reject('timeout'), ReacoloDirtyModelSync._ACK_TIMEOUT);
      // Set the message id to the ack callbacks. The callback will be called when the corresponding
      // 'ack' message comes from the server.
      ReacoloDirtyModelSync._ackCallbacks.set(msgId, (...args) => {
        clearTimeout(timeout);
        resolve(...args);
      });
      this._socket.send(JSON.stringify({ type, data, id: msgId }));
    });
    ReacoloDirtyModelSync._ackCallbacks.delete(messageId);
    if (!success) {
      throw response;
    }
    return response;
  }
}

// List of the events.
ReacoloDirtyModelSync.CONNECTED = Symbol('connected');
ReacoloDirtyModelSync.DISCONNECTED = Symbol('event disconnected');
ReacoloDirtyModelSync.DATA_UPDATE = Symbol('event data:update');
ReacoloDirtyModelSync.CONTEXT_UPDATE = Symbol('event context:update');
ReacoloDirtyModelSync.CONNECTION_ERROR = Symbol('event connection:error');

// Private static members.
ReacoloDirtyModelSync._PREFIX = '/socket';
ReacoloDirtyModelSync._ACK_TIMEOUT = 20000;
ReacoloDirtyModelSync._nextMessageId = 0;
ReacoloDirtyModelSync._ackCallbacks = new Map();

// We need to use commonjs here as webpack does not works with export default.
module.exports = ReacoloDirtyModelSync;
