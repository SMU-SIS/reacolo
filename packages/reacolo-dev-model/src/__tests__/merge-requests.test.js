import mergeRequests from '../merge-requests';
import {
  SET_DATA_MSG_TYPE,
  SET_CLIENT_ROLE_MSG_TYPE,
  PATCH_DATA_MSG_TYPE,
  GET_DATA_MSG_TYPE,
  GET_META_DATA_MSG_TYPE
} from '../constants/message-types.js';

describe('`mergeRequests`', () => {
  test('does not merge incompatible requests', () => {
    expect(
      mergeRequests(
        { type: GET_DATA_MSG_TYPE, data: { a: 0 } },
        { type: GET_META_DATA_MSG_TYPE, data: { b: 1 } }
      )
    ).toBe(undefined);
    expect(
      mergeRequests(
        { type: '?', data: { a: 0 } },
        { type: GET_DATA_MSG_TYPE, data: { b: 1 } }
      )
    ).toBe(undefined);
    expect(
      mergeRequests(
        { type: GET_META_DATA_MSG_TYPE, data: { b: 1 } },
        { type: '?', data: { a: 0 } }
      )
    ).toBe(undefined);
  });

  test('properly merges similar overwriting requests', () => {
    [
      SET_CLIENT_ROLE_MSG_TYPE,
      GET_META_DATA_MSG_TYPE,
      GET_DATA_MSG_TYPE,
      SET_DATA_MSG_TYPE
    ].forEach((type) => {
      expect(
        mergeRequests({ type, data: { a: 0 } }, { type, data: { b: 1 } })
      ).toEqual({ type, data: { b: 1 } });
    });
  });

  test('properly merges patches', () => {
    expect(
      mergeRequests(
        {
          type: PATCH_DATA_MSG_TYPE,
          data: { patch: [{ a: 0 }, { a: 2 }], from: 1 }
        },
        {
          type: PATCH_DATA_MSG_TYPE,
          data: { patch: [{ b: 1 }, { b: 4 }], from: 5 }
        }
      )
    ).toEqual({
      type: PATCH_DATA_MSG_TYPE,
      data: { patch: [{ a: 0 }, { a: 2 }, { b: 1 }, { b: 4 }], from: 1 }
    });
    expect(
      mergeRequests(
        { type: PATCH_DATA_MSG_TYPE, data: [{ a: 0 }] },
        { type: SET_DATA_MSG_TYPE, data: { b: 1 } }
      )
    ).toEqual({
      type: SET_DATA_MSG_TYPE,
      data: { b: 1 }
    });
  });
});
