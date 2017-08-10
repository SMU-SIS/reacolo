/* global cordova */
// Fetch the cordova ecology plugin
const CORDOVA_ECOLOGY = cordova.plugins.CordovaEcology;

export default class EcologyEventBroadcaster {
  _subscribe(eventType, listener) {
    CORDOVA_ECOLOGY.subscribeEvent(eventType, listener);
  }

  _unsubscribe(eventType, listener) {
    CORDOVA_ECOLOGY.unsubscribeEvent(eventType, listener);
  }

  publish(eventType, eventData) {
    CORDOVA_ECOLOGY.publishEvent(eventType, eventData);
  }
}
