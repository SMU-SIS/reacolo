import mergeRequests from '../merge-requests';
import * as MessageTypes from '../message-types.js';

describe('`mergeRequests`', () => {
  test('does not merge incompatible requests', () => {
    expect(
      mergeRequests(
        { type: MessageTypes.APP_DATA_MSG_TYPE, data: { a: 0 } },
        { type: MessageTypes.CONTEXT_REQUEST_MSG_TYPE, data: { b: 1 } }
      )
    ).toBe(undefined);
    expect(
      mergeRequests(
        { type: '?', data: { a: 0 } },
        { type: MessageTypes.APP_DATA_MSG_TYPE, data: { b: 1 } }
      )
    ).toBe(undefined);
    expect(
      mergeRequests(
        { type: MessageTypes.CONTEXT_REQUEST_MSG_TYPE, data: { b: 1 } },
        { type: '?', data: { a: 0 } }
      )
    ).toBe(undefined);
  });

  test('properly merges similar overwriting requests', () => {
    [
      MessageTypes.SET_CLIENT_ROLE_MSG_TYPE,
      MessageTypes.CONTEXT_REQUEST_MSG_TYPE,
      MessageTypes.APP_DATA_REQUEST_MSG_TYPE,
      MessageTypes.SET_APP_DATA_MSG_TYPE
    ].forEach((type) => {
      expect(
        mergeRequests({ type, data: { a: 0 } }, { type, data: { b: 1 } })
      ).toEqual({ type, data: { b: 1 } });
    });
  });

  test('properly merges patches', () => {
    expect(
      mergeRequests(
        { type: MessageTypes.PATCH_DATA_MSG_TYPE, data: [{ a: 0 }] },
        { type: MessageTypes.PATCH_DATA_MSG_TYPE, data: [{ b: 1 }] }
      )
    ).toEqual({
      type: MessageTypes.PATCH_DATA_MSG_TYPE,
      data: [{ a: 0 }, { b: 1 }]
    });
    expect(
      mergeRequests(
        { type: MessageTypes.PATCH_DATA_MSG_TYPE, data: [{ a: 0 }] },
        { type: MessageTypes.SET_APP_DATA_MSG_TYPE, data: { b: 1 } }
      )
    ).toEqual({
      type: MessageTypes.SET_APP_DATA_MSG_TYPE,
      data: { b: 1 }
    });
  });
});
