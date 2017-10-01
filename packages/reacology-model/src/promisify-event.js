export default (subscribe, unsubscribe) =>
  new Promise((resolve, reject) => {
    const listener = (...args) => {
      try {
        // Remove the event listener before resolving.
        unsubscribe(listener);
        resolve(...args);
      } catch (e) {
        // Catch any error in the process above as those are not in the body
        // of the promise.
        reject(e);
      }
    };
    // Add the event listener.
    subscribe(listener);
  });
