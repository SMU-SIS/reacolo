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
    this.onUpdate(JSON.parse(message.data));
  }

  _onSocketOpen() {
    this.onConnected();
  }

  _onSocketClose() {
    this.onDisconnected();
  }

  set(appData) {
    this._socket.send(JSON.stringify({
      type: 'set_app_data',
      data: appData
    }));
  }

}

ModelSync._PREFIX = '/socket';
