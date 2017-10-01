/* global cordova */

export default class EcologyEventBroadcaster {
  subscribe(eventType, listener) {
    cordova.plugins.CordovaEcology.subscribeEvent(eventType, listener);
  }

  unsubscribe(eventType, listener) {
    cordova.plugins.CordovaEcology.unsubscribeEvent(eventType, listener);
  }

  publish(eventType, eventData) {
    cordova.plugins.CordovaEcology.publishEvent(eventType, eventData);
  }
}
