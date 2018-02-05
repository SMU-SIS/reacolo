import createMatcher from '../create-matcher';

describe('contextPropsToMatcher', () => {
  it('properly extract matcher settings from a set of properties', () => {
    expect(
      createMatcher({
        prop1: 'ignore me',
        matchTest: 'test value',
        match: { a: 'a value', b: { bProp: 'value' } },
        prop2: 'ignore me again',
        matchOtherTest: { other: 'test' },
        render: () => 'stuff',
      }),
    ).toEqual({
      test: 'test value',
      a: 'a value',
      b: { bProp: 'value' },
      otherTest: { other: 'test' },
    });
  });
});
