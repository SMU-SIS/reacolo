/**
 * Creates a scheduled function call.
 * @module {func} reacolo-dev-model/schedule
 * @private
 * @param {Object} delay - The delay after which to call the function.
 * @param {number} f - The function to call.
 * @param {func} [onCanceled] - The function to call on schedule cancel.
 * @return {schedule~ScheduledCall} The scheduled call.
 */
const schedule = (delay, f, onCanceled) => {
  let isCanceled = false;
  let hasRun = false;
  let cancel = null;

  const promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      try {
        if (f) f();
        hasRun = true;
        resolve();
      } catch (e) {
        hasRun = true;
        reject(e);
      }
    }, delay);
    cancel = (...args) => {
      isCanceled = true;
      clearTimeout(timeout);
      if (onCanceled) onCanceled(...args);
      reject();
    };
  });

  /**
   * @interface schedule~ScheduledCall
   * @private
   */
  return {
    /**
     * Cancel the scheduled call.
     * @function
     * @memberof schedule~ScheduledCall#
     * @return {undefined}
     */
    cancel,

    /**
     * A promise resolved when the scheduled call has been called, and rejected
     * when it is rejected.
     *
     * @memberof schedule~ScheduledCall#
     * @readonly
     * @type {Promise}
     */
    get promise() {
      return promise;
    },

    /**
     * True if the call has been canceled.
     *
     * @memberof schedule~ScheduledCall#
     * @readonly
     * @type {boolean}
     */
    get isCanceled() {
      return isCanceled;
    },

    /**
     * True if the function has been executed.
     *
     * @memberof schedule~ScheduledCall#
     * @readonly
     * @type {boolean}
     */
    get hasRun() {
      return hasRun;
    },

    /**
     * True if the schedule is done (i.e. the function has run or has been
     * canceled).
     *
     * @memberof schedule~ScheduledCall#
     * @readonly
     * @type {boolean}
     */
    get isDone() {
      return isCanceled || hasRun;
    },
  };
};

export default schedule;
