import SockJS from 'sockjs-client';

const nullFunc = () => {};

export default class ModelSync {

  constructor(serverAddress = `http://${location.host}${ModelSync._PREFIX}`, role) {
    this._role = role;

    this._appData = null;
    this._context = null;

    this.onUpdate = nullFunc;
    this.onConnected = nullFunc;
    this.onDisconnected = nullFunc;

    this._socket = new SockJS(serverAddress);
    this._socket.onmessage = this._onSocketMessage.bind(this);
    this._socket.onopen = this._onSocketOpen.bind(this);
    this._socket.onclose = this._onSocketClose.bind(this);
  }

  setAppData(appData) {
    this._socketSend('set_app_data', appData);
  }

  get role() {
    return this._role;
  }

  _onSocketOpen() {
    if (this._role) {
      this._socketSend('set_socket_role', this._role);
    }
    this._socketSend('app_data_request', this._role);
    this.onConnected();
  }

  _onSocketMessage(originalMessage) {
    const message = JSON.parse(originalMessage.data);
    const messageType = message.type;
    const messageData = message.data;
    switch (messageType) {
      case 'app_data':
        this._appData = messageData;
        this.onUpdate(this._appData, this._context);
        break;
      case 'meta_data':
        this._context = {
          role: this._role,
          roleAssignations: messageData.clientRoles
        };
        this.onUpdate(this._appData, this._context);
        break;
      default:
        console.warn(`Unknown message type: ${messageType}`);
    }
  }

  _onSocketClose() {
    this.onDisconnected();
  }

  _socketSend(type, data) {
    this._socket.send(JSON.stringify({ type, data }));
  }

}

ModelSync._PREFIX = '/socket';
