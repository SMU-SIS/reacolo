import ModelSubscription from '../model-subscription';

describe('subscription', () => {
  const createModel = () => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
  });

  it('it registers on subscribe', () => {
    const model = createModel();
    const sub = ModelSubscription(model, () => {}, 'testEventName');
    // Does not register prematurely.
    expect(model.addListener.mock.calls.length).toBe(0);
    sub.subscribe();
    // Registers on subscribe
    expect(model.addListener.mock.calls.length).toBe(1);
    expect(model.addListener.mock.calls[0][0]).toBe('testEventName');
    expect(typeof model.addListener.mock.calls[0][1]).toBe('function');
  });

  it('it un-registers on unsubscribe', () => {
    const model = createModel();
    const sub = ModelSubscription(model, () => {}, 'testEventName');
    sub.subscribe();
    expect(model.removeListener.mock.calls.length).toBe(0);
    sub.unsubscribe();
    expect(model.removeListener.mock.calls).toEqual(
      model.addListener.mock.calls,
    );
  });

  it('it subscribes only once before being unsubscribed', () => {
    const model = createModel();
    const sub = ModelSubscription(model, () => {}, 'testEventName');
    sub.subscribe();
    sub.subscribe();
    // Registers on subscribe
    expect(model.addListener.mock.calls.length).toBe(1);
  });

  it('it does not unsubscribed before being subscribed', () => {
    const model = createModel();
    const sub = ModelSubscription(model, () => {}, 'testEventName');
    sub.unsubscribe();
    expect(model.addListener.mock.calls.length).toBe(0);
    expect(model.removeListener.mock.calls.length).toBe(0);
  });

  it('it only unsubscribes once', () => {
    const model = createModel();
    const sub = ModelSubscription(model, () => {}, 'testEventName');
    sub.subscribe();
    sub.unsubscribe();
    sub.unsubscribe();
    expect(model.addListener.mock.calls.length).toBe(1);
    expect(model.removeListener.mock.calls.length).toBe(1);
  });

  it('it can be resubscribed to', () => {
    const model = createModel();
    const sub = ModelSubscription(model, () => {}, 'testEventName');
    sub.subscribe();
    sub.unsubscribe();
    sub.subscribe();
    sub.unsubscribe();
    sub.subscribe();
    sub.unsubscribe();
    expect(model.addListener.mock.calls.length).toBe(3);
    expect(model.removeListener.mock.calls.length).toBe(3);
  });

  it('it calls callback on update when subscribed', () => {
    const model = createModel();
    const cb = jest.fn();
    const sub = ModelSubscription(model, cb, 'testEventName');
    sub.subscribe();
    model.addListener.mock.calls[0][1]('arg11', 'arg12');
    expect(cb.mock.calls).toEqual([['arg11', 'arg12']]);
    model.addListener.mock.calls[0][1]('arg21', 'arg22');
    expect(cb.mock.calls).toEqual([['arg11', 'arg12'], ['arg21', 'arg22']]);
  });

  it('it stops calling callback after being unsubscribed', () => {
    const model = createModel();
    const cb = jest.fn();
    const sub = ModelSubscription(model, cb, 'testEventName');
    sub.subscribe();
    model.addListener.mock.calls[0][1]('arg11', 'arg12');
    sub.unsubscribe();
    model.addListener.mock.calls[0][1]('arg21', 'arg22');
    expect(cb.mock.calls).toEqual([['arg11', 'arg12']]);
  });
});
