/* global cordova */
import EventEmitter from 'eventemitter3';
import promisifyEvent from './promisify-event';
import EcologyEventBroadcaster from './ecology-event-broadcaster';

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
    this._context = {
      clientRole: undefined,
      roles: {}
    };
    this._isConnected = false;
    this._deviceId = null;
    this._ecologyConfig = config;

    // Set up the event broadcaster as a read only property.
    Object.defineProperty(this, 'eventBroadcaster', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: new EcologyEventBroadcaster()
    });
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
      cordova.plugins.CordovaEcology.setData('data', newData, () =>
        resolve(newData)
      );
    });
  }

  /**
   * Set the application context.
   *
   * @param {object} newContext the new context.
   */
  setAppContext(newContext) {
    cordova.plugins.CordovaEcology.setData('context', newContext);
  }

  /**
   * Start the data synchronization.
   * @return {Promise} A promise resolved once the connection is established.
   */
  async start() {
    // If the model sync is already connected, nothing happens.
    if (this.isConnected) return;
    const cordovaPlugin = cordova.plugins.CordovaEcology;
    // Wait for the device to be ready. This is safe. Indeed, this particular
    // event has an odd behavior: if the device is already ready, the event is
    // immediately emitted once subscribed.
    await promisifyEvent(
      (l) => { document.addEventListener('deviceready', l); },
      (l) => { document.removeEventListener('deviceready', l); }
    );
    // Subscribe to cordova events.
    cordovaPlugin.subscribeEvent('syncData', this._onSyncData.bind(this));
    cordovaPlugin.subscribeEvent(
      'ecology:disconnected',
      this._onDisconnected.bind(this)
    );
    if (!await cordovaPlugin.isConnected()) {
      // If the ecology is not connected, connect it. We subscribe to the event
      // first, just in case it is synchronously emitted.
      // FIXME: if the connection parameters have changed, they are just
      // silently ignored...
      const prom = promisifyEvent(
        (l) => { cordovaPlugin.subscribeEvent('ecology:connected', l); },
        (l) => { cordovaPlugin.unsubscribeEvent('ecology:connected', l); }
      );
      // Connect to the ecology. Throws if ecology is already created.
      cordovaPlugin.ecologyConnect(this._ecologyConfig);
      await prom;
    }
    // Fetch (in parallel) and initialize device id and data.
    const [{ myDeviceId }, data] = await Promise.all([
      cordovaPlugin.getMyDeviceId(),
      cordovaPlugin.getData('data')
    ]);
    this._onContextUpdate(
      Object.assign({}, this._context, { clientRole: myDeviceId })
    );
    this._onDataUpdate(data);
    // Once data and client role has been initialized, notify the connection.
    this._isConnected = true;
    this.emit(Events.CONNECTED);
  }

  _onSyncData({ data: [key, newValue] }) {
    switch (key) {
      case 'data':
        // Parse the data to workaround cordova plugin bug.
        this._onDataUpdate(newValue);
        break;
      case 'context':
        cordova.plugins.CordovaEcology
          .getAvailableDevices()
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

  _onDisconnected() {
    this._isConnected = false;
    // Notify that the model has been disconnected.
    this.emit(Events.DISCONNECTED);
  }

  /**
   * Stop the data synchronization.
   */
  stop() {
    if (this._isConnected) {
      cordova.plugins.CordovaEcology.ecologyDisconnect();

      this._isConnected = false;
      // Notify that the model has been disconnected.
      this.emit(Events.DISCONNECTED);
    }
    return Promise.resolve();
  }
}

export default CordovaEcologyModelSync;
