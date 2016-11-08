import SockJS from 'sockjs-client';

const nullFunc = () => {};

export default class ModelSync {

  constructor(serverAddress = `http://${location.host}${ModelSync._PREFIX}`) {
    this.onUpdate = nullFunc;
    this.onConnected = nullFunc;
    this.onDisconnected = nullFunc;

    this._socket = new SockJS(serverAddress);
    this._socket.onmessage = this._onSocketMessage.bind(this);
    this._socket.onOpen = this._onSocketOpen.bind(this);
    this._socket.onClose = this._onSocketClose.bind(this);
  }

  _onSocketMessage(message) {
    this.onUpdate(JSON.parse(message.data));
  }

  _onSocketOpen() {
    this.onConnected();
  }

  _onSocketClose() {
    this.onDisconnected();
  }

  set(appData) {
    this._socket.send(JSON.stringify(appData));
  }

}

ModelSync._PREFIX = '/socket';
