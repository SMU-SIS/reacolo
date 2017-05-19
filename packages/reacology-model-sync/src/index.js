/* eslint-disable class-methods-use-this */
import global from 'global';
import EventEmitter from 'eventemitter3';

// Fetch the reacology interface (should be injected by Android).
const REACOLOGY = global.reacology;

// Default ecology interface (when no model sync is connected).
const DEFAULT_INTERFACE = {
  onDataUpdate: () => {},
  onContextUpdate: () => {},
  connected: false
};

// Declare if reacology is available or not.
export const isReacologyAvailable = !!REACOLOGY;

// Make sure there is an android interface ready even if no model sync is created.
if (isReacologyAvailable) {
  Object.assign(REACOLOGY, DEFAULT_INTERFACE);
}

/**
 * Listen to ecology notifications from Android.
 *
 * @param  {function} onDataUpdate    callback to be called when the data updated.
 * @param  {function} onContextUpdate callabeck to be called when the context is updated.
 */
const connect = (onDataUpdate, onContextUpdate) => {
  Object.assign(REACOLOGY, { onDataUpdate, onContextUpdate, connected: true });
};

/**
 * Stop listening to ecology notifications from Android and restore the default interface.
 */
const disconnect = () => {
  Object.assign(REACOLOGY, DEFAULT_INTERFACE);
};

/**
 * @return {boolean} true if a model sync is connected to reacology.
 */
const reacologyConnected = () => REACOLOGY.connected;

// Event emitted by the model.
const Events = {
  CONNECTED: Symbol.for('connected'),
  DISCONNECTED: Symbol.for('disconnected'),
  DATA_UPDATE: Symbol.for('data:update'),
  CONTEXT_UPDATE: Symbol.for('context:update')
};

export class ReacologyModelSync extends EventEmitter {
  constructor() {
    if (!isReacologyAvailable) {
      throw new Error('Cannot create ReacologyModelSync: Reacology unavailable.');
    }
    super();
    this._data = {};
    this._context = {};
    this._isConnected = false;
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
      REACOLOGY.setData(JSON.stringify(newData));
      resolve(newData);
    });
  }

  /**
   * Start the data synchronization.
   */
  start() {
    if (this.isConnected) return Promise.resolve();
    if (reacologyConnected()) {
      throw new Error('Cannot connect more than one ReacologyModelSync.' +
        'Re-use the previous one (recommended), or stop it before creating a new one.');
    }

    // Register for android notifications.
    connect(
      this._onDataUpdate.bind(this),
      this._onContextUpdate.bind(this)
    );

    // Init the data.
    this._onDataUpdate(JSON.parse(REACOLOGY.getData()));
    this._isConnected = true;

    // Notify that the model has been connected.
    this.emit(Events.CONNECTED);

    // Model sync interface require start to return a promise. However reacology connection is
    // sync so we return a resolved promise.
    return Promise.resolve();
  }

  /**
   * Stop the data synchronization.
   */
  stop() {
    if (this._isConnected) {
      // Stop listening for android notificatins.
      disconnect();
      this._isConnected = false;
      // Notify that the event has been disconnected.
      this.emit(Events.DISCONNECTED);
    }
    return Promise.resolve();
  }
}

// Add the events as static properties of the Model Sync.
Object.assign(ReacologyModelSync, Events);

// Reacology Model Sync is the default.
export default ReacologyModelSync;
