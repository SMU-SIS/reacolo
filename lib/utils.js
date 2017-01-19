// Promisification of a timeout (uncancellable).
export const wait = delay => new Promise(resolve => setTimeout(resolve, delay));
