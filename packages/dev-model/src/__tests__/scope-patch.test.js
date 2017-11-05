import scopePatch from '../scope-patch.js';

jest.useFakeTimers();

describe('`scopePatch`', () => {
  test('properly moves the application of a JSON patch', () => {
    expect(
      scopePatch('/newRoot/newSub', [
        { op: 'add', path: '/biscuits/1', value: { name: 'Ginger Nut' } },
        { op: 'remove', path: '/biscuits' },
        { op: 'copy', from: '/biscuits/0', path: '/best_biscuit' },
        { op: 'move', from: '/biscuits', path: '/cookies' },
        { op: 'test', path: '/best_biscuit/name', value: 'Choco Leibniz' },
      ]),
    ).toEqual([
      {
        op: 'add',
        path: '/newRoot/newSub/biscuits/1',
        value: { name: 'Ginger Nut' },
      },
      { op: 'remove', path: '/newRoot/newSub/biscuits' },
      {
        op: 'copy',
        from: '/newRoot/newSub/biscuits/0',
        path: '/newRoot/newSub/best_biscuit',
      },
      {
        op: 'move',
        from: '/newRoot/newSub/biscuits',
        path: '/newRoot/newSub/cookies',
      },
      {
        op: 'test',
        path: '/newRoot/newSub/best_biscuit/name',
        value: 'Choco Leibniz',
      },
    ]);
  });
});
