import EventEmitter from 'eventemitter3';

// Fetch the cordova ecology plugin
const CORDOVA_ECOLOGY = cordova.plugins.CordovaEcology;

// Events emitted by the model.
const Events = {
  CONNECTED: Symbol.for('connected'),
  DISCONNECTED: Symbol.for('disconnected'),
  DATA_UPDATE: Symbol.for('data:update'),
  CONTEXT_UPDATE: Symbol.for('context:update')
};

export class CordovaEcologyModelSync extends EventEmitter {
  constructor(config) {
    super();
    this._data = {};
    this._context = {};
    this._isConnected = false;
    this._deviceId = null;
    this._ecologyConfig = config;
  }

  _onDataUpdate(data) {
    this._data = data;
    this.emit(Events.DATA_UPDATE, this._data, true);
  }

  _onContextUpdate(context) {
    this._context = context;
    this.emit(Events.CONTEXT_UPDATE, this._context, true);
  }

  /**
   * @return {boolean} True if the model sync is currently connected.
   */
  get isConnected() {
    return this._isConnected;
  }

  /**
   * @return {object} The current application data.
   */
  get data() {
    return this._data;
  }

  /**
   * @return {object} The current context.
   */
  get context() {
    return this._context;
  }

  /**
   * Set the application data.
   *
   * @param {object} newData the new data.
   */
  setAppData(newData) {
    return new Promise((resolve) => {
      CORDOVA_ECOLOGY.setData('data', newData, () => resolve(newData));
    });
  }

  /**
   * Set the application context.
   *
   * @param {object} newContext the new context.
   */
  setAppContext(newContext) {
    CORDOVA_ECOLOGY.setData('context', newContext)
  }

  /**
   * Start the data synchronization.
   */
  start() {
    if (this.isConnected) return Promise.resolve();

    return new Promise((resolve) => {
      // Connect to the ecology. Throws if ecology is already created.
      CORDOVA_ECOLOGY.ecologyConnect(this._ecologyConfig);

      const startHandler = () => {
        // Start handler must be called only once so we unsubscribe to the event.
        CORDOVA_ECOLOGY.unsubscribeEvent('device:connected', startHandler);
        // Subscribe to cordova events.
        CORDOVA_ECOLOGY.subscribeEvent('device:connected', this._deviceConnected.bind(this));
        CORDOVA_ECOLOGY.subscribeEvent('device:disconnected', this._deviceDisconnected.bind(this));
        CORDOVA_ECOLOGY.subscribeEvent('syncData', this._onSyncData.bind(this));
        CORDOVA_ECOLOGY.getMyDeviceId().then(this._myDeviceId.bind(this));
        this._isConnected = true;
        // Notify that the model has been connected.
        this.emit(Events.CONNECTED);
        // Resolve the connection promize
        resolve();
      };
      // Once we get the first device:connected event, we know the model sync is connected.
      CORDOVA_ECOLOGY.subscribeEvent('device:connected', startHandler);
    })
      // Automatically fetch the initial data and notify.
      .then(CORDOVA_ECOLOGY.getData('data'))
      .then(({ data }) => {
        console.log('initdata', { data });
        // Parse the data to workaround cordova plugin bug.
        this._onDataUpdate(data);
      });
  }

  _deviceConnected(connectDeviceData) {
    console.log(`_deviceConnected, ${connectDeviceData.data}`);
  }

  _deviceDisconnected(disconnectDeviceData) {
    console.log('_deviceDisconnected');
  }

  _onSyncData({ data: [key, newValue] }) {
    switch (key) {
      case 'data':
        // Parse the data to workaround cordova plugin bug.
        this._onDataUpdate(newValue);
        break;
      case 'context':
        CORDOVA_ECOLOGY.getAvailableDevices()
          .then(({ availableDevices: roles }) => {
              const contextData = {
                roles,
                clientRole: this._deviceId
              };
              const newContextData = Object.assign({}, newValue, contextData);
              this._onContextUpdate(newContextData);
          });
        break;
      default:
    }
  }

  _myDeviceId(deviceIdData) {
      this._deviceId = deviceIdData.myDeviceId;
  }

  /**
   * Stop the data synchronization.
   */
  stop() {
    if (this._isConnected) {
      CORDOVA_ECOLOGY.ecologyDisconnect();

      this._isConnected = false;
      // Notify that the model has been disconnected.
      this.emit(Events.DISCONNECTED);
    }
    return Promise.resolve();
  }

}

export default CordovaEcologyModelSync;
