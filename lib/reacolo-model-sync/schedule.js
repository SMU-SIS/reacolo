// A class that can be used to schedule or cancel a function call.
export default class Schedule {
  constructor(delay, f, onCanceled) {
    this._isCanceled = false;
    this._hasRun = false;
    this.promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, delay);
      this.cancel = (...args) => {
        this._isCanceled = true;
        clearTimeout(timeout);
        reject(...args);
      };
    }).then(f, onCanceled)
      .then(() => { this._hasRun = true; });
  }
  get isCanceled() {
    return this._isCanceled;
  }
  get hasRun() {
    return this._hasRun;
  }
  get isDone() {
    return this._isCanceled || this._hasRun;
  }
}
