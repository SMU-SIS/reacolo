import wait from 'wait-then';
import schedule from '../schedule';

jest.useFakeTimers();

test('waits x second before calling the function', async () => {
  // Create the callback and the scheduled call.
  const f = jest.fn();
  schedule(456, f);

  // At this point in time, the callback should not have been called yet
  expect(f).not.toBeCalled();

  expect(setTimeout.mock.calls.length).toBe(1);
  expect(setTimeout.mock.calls[0][1]).toBe(456);

  // Fast-forward until all timers have been executed
  jest.runTimersToTime(456);

  // This is actually asynchronous, so we need to wait for one more tick.
  const pWait = wait();
  jest.runTimersToTime(0);
  await pWait;

  // Now our callback should have been called!
  // expect(f).toBeCalled();
  expect(f.mock.calls.length).toBe(1);
});
