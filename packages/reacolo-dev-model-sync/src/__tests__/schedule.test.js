import schedule from '../schedule';

jest.useFakeTimers();

describe('`schedule`', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('waits before calling the function', async () => {
    // Create the callback and the scheduled call.
    const f = jest.fn();
    const s = schedule(12456, f);
    const resolved = jest.fn();
    s.promise.then(resolved);

    // At this point in time, the callback should not have been called yet.
    expect(f).not.toBeCalled();
    expect(resolved).not.toBeCalled();
    expect(s.hasRun).toBe(false);
    expect(s.isDone).toBe(false);
    expect(s.isCanceled).toBe(false);

    expect(setTimeout.mock.calls.length).toBe(1);
    expect(setTimeout.mock.calls[0][1]).toBe(12456);

    // Fast-forward until all timers have been executed
    jest.runTimersToTime(12460);
    // Wait for a tick.
    await Promise.resolve();

    // Now our callback should have been called!
    expect(f.mock.calls.length).toBe(1);
    expect(resolved.mock.calls.length).toBe(1);
    expect(s.hasRun).toBe(true);
    expect(s.isCanceled).toBe(false);
    expect(s.isDone).toBe(true);
  });

  test('can be canceled', async () => {
    // Create the callback and the scheduled call.
    const f = jest.fn();
    const onCanceled = jest.fn();
    const s = schedule(423, f, onCanceled);
    const onRejected = jest.fn();
    s.promise.catch(onRejected);

    // At this point in time, the callbacks should not have been called yet.
    expect(onCanceled).not.toBeCalled();
    expect(onRejected).not.toBeCalled();
    expect(s.hasRun).toBe(false);
    expect(s.isCanceled).toBe(false);
    expect(s.isDone).toBe(false);

    // Wait for a tick.
    await Promise.resolve();

    // Cancel the call.
    s.cancel('nope');
    expect(onCanceled.mock.calls.length).toBe(1);

    // Fast-forward until all timers have been executed.
    jest.runAllTimers();
    // Wait for a tick.
    await Promise.resolve();

    // Check what has been called.
    expect(f).not.toBeCalled();
    expect(onCanceled.mock.calls).toEqual([['nope']]);
    expect(onRejected.mock.calls.length).toBe(1);
    expect(s.hasRun).toBe(false);
    expect(s.isCanceled).toBe(true);
    expect(s.isDone).toBe(true);
  });

  test('rejects when the function throws, but set has run to true', async () => {
    // Create the callback and the scheduled call.
    const err = new Error('test');
    const f = jest.fn(() => {
      throw err;
    });
    const onCanceled = jest.fn();
    const s = schedule(423, f, onCanceled);
    const onRejected = jest.fn();
    s.promise.catch(onRejected);

    // Fast-forward until all timers have been executed.
    jest.runAllTimers();
    // Wait for a tick.
    await Promise.resolve();

    // Check what has been called.
    expect(f.mock.calls.length).toBe(1);
    expect(onCanceled).not.toBeCalled();
    expect(onRejected.mock.calls).toEqual([[err]]);
    expect(s.hasRun).toBe(true);
    expect(s.isCanceled).toBe(false);
    expect(s.isDone).toBe(true);
  });
});
