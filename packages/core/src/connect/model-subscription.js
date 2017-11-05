/**
 * Simple wrapper around an event callback to make sure the callback is
 * not called after being unsubscribed.
 * @param {{addListener:func, removeListener: func}} model - The model to
 * subscribe to.
 * @param {func} callback - The callback to call on model update.
 * @param {string} eventName - The event name to subscribe to
 * @return {{subscribe: func, unsubscribe: func}} The subscription interface.
 */
export default (model, callback, eventName) => {
  let isSubscribed = false;
  const internalCallback = (...args) => {
    if (isSubscribed) {
      callback(...args);
    }
  };
  return {
    subscribe() {
      if (!isSubscribed) {
        isSubscribed = true;
        model.addListener(eventName, internalCallback);
      }
    },
    unsubscribe() {
      if (isSubscribed) {
        isSubscribed = false;
        model.removeListener(eventName, internalCallback);
      }
    },
  };
};
