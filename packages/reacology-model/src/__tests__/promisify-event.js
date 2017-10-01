/* eslint-env jest */
import promisifyEvent from '../promisify-event';

describe('`promisifyEvent`', () => {
  test('properly subscribes to events', () => {
    expect.assertions(4);
    const add = jest.fn();
    const remove = jest.fn();
    promisifyEvent(add, remove).then((val) => {
      expect(remove.mock.calls.length).toBe(1);
      expect(remove.mock.calls[0][0]).toBe(add.mock.calls[0][0]);
      expect(val).toBe('test');
    });
    expect(add.mock.calls.length).toBe(1);
    add.mock.calls[0][0].call(null, 'test');
  });

  test('properly rejects on subscription errors', () => {
    expect.assertions(2);
    const error = new Error('test');
    const add = jest.fn(() => {
      throw error;
    });
    const remove = jest.fn();
    promisifyEvent(add, remove).catch((err) => {
      expect(err).toBe(error);
    });
    expect(add.mock.calls.length).toBe(1);
  });

  test('properly rejects on un-subscription errors', () => {
    expect.assertions(3);
    const error = new Error('test');
    const add = jest.fn();
    const remove = jest.fn(() => {
      throw error;
    });
    promisifyEvent(add, remove).catch((err) => {
      expect(remove.mock.calls.length).toBe(1);
      expect(err).toBe(error);
    });
    expect(add.mock.calls.length).toBe(1);
    add.mock.calls[0][0].call(null, 'test');
  });
});
