import SockJS from 'sockjs-client';

const nullFunc = () => {};

export default class ModelSync {

  constructor(serverAddress = `http://${location.host}${ModelSync._PREFIX}`, role) {
    this._role = role;

    this.onUpdate = nullFunc;
    this.onConnected = nullFunc;
    this.onDisconnected = nullFunc;

    this._socket = new SockJS(serverAddress);
    this._socket.onmessage = this._onSocketMessage.bind(this);
    this._socket.onopen = this._onSocketOpen.bind(this);
    this._socket.onclose = this._onSocketClose.bind(this);
  }

  _onSocketMessage(originalMessage) {
    const message = JSON.parse(originalMessage.data);
    const messageType = message.type;
    const messageData = message.data;
    switch (messageType) {
      case 'data':
        this.onUpdate(messageData);
        break;
      default:
        console.log(`Unknown message type: ${messageType}`);
    }
  }

  set(appData) {
    this._socketSend('set_app_data', appData);
  }

  _onSocketOpen() {
    if (this._role) {
      this._socketSend('set_socket_role', this._role);
    }
    this.onConnected();
  }

  _onSocketClose() {
    this.onDisconnected();
  }

  _socketSend(type, data) {
    this._socket.send(JSON.stringify({ type, data }));
  }

}

ModelSync._PREFIX = '/socket';
