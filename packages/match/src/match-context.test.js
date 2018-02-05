import matchContext, {
  matchContextProperty,
  matchContextPropertyTarget,
  decodeContextProperty,
} from './match-context';
import { WILD_CASE } from './constants';

describe('simple matchContextPropertyTarget', () => {
  it('returns true when there is one value > 0 corresponding to the sole provided target', () => {
    expect(
      matchContextPropertyTarget({ foo: 1 }, [
        { name: 'foo', optional: false },
      ]),
    ).toBe(true);
    expect(
      matchContextPropertyTarget({ foo: 3 }, [
        { name: 'foo', optional: false },
      ]),
    ).toBe(true);
  });

  it('returns false when there is no value > 0 and one target', () => {
    expect(
      matchContextPropertyTarget({ foo: 0 }, [
        { name: 'foo', optional: false },
      ]),
    ).toBe(false);
    expect(
      matchContextPropertyTarget({}, [{ name: 'foo', optional: false }]),
    ).toBe(false);
  });

  it('returns true when there is several targets, all with value > 0', () => {
    expect(
      matchContextPropertyTarget({ bar: 4, foo: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ bar: 4, foo: 1, nope: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget(
        {
          bar: 4,
          foo: 1,
          stuff: 1,
        },
        [
          { name: 'foo', optional: false },
          { name: 'bar', optional: false },
          { name: 'stuff', optional: false },
        ],
      ),
    ).toBe(true);
  });

  it('returns false when there is several targets and one of them has value = 0', () => {
    expect(
      matchContextPropertyTarget({ bar: 4, foo: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget(
        {
          bar: 0,
          foo: 2,
          stuff: 1,
        },
        [
          { name: 'foo', optional: false },
          { name: 'bar', optional: false },
          { name: 'stuff', optional: false },
        ],
      ),
    ).toBe(false);
  });

  it('returns false when there is several targets and one of them is not here', () => {
    expect(
      matchContextPropertyTarget({ foo: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget(
        {
          bar: 1,
          stuff: 4,
        },
        [
          { name: 'foo', optional: false },
          { name: 'bar', optional: false },
          { name: 'stuff', optional: false },
        ],
      ),
    ).toBe(false);
  });

  it('returns false when there is several targets and none are here', () => {
    expect(
      matchContextPropertyTarget({}, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ bar: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(false);
  });

  it('returns false when there is extraneous values', () => {
    expect(
      matchContextPropertyTarget(
        {
          foo: 1,
          bar: 1,
        },
        [{ name: 'bar', optional: false }],
      ),
    ).toBe(false);

    expect(
      matchContextPropertyTarget(
        {
          foo: 2,
          bar: 2,
          stuff: 0,
        },
        [{ name: 'bar', optional: false }],
      ),
    ).toBe(false);

    expect(
      matchContextPropertyTarget(
        {
          foo: 2,
          bar: 2,
          stuff: 1,
        },
        [{ name: 'bar', optional: false }, { name: 'stuff', optional: false }],
      ),
    ).toBe(false);
  });

  it('returns true when there is several values but only the target(s) are > 0', () => {
    expect(
      matchContextPropertyTarget({ foo: 1, bar: 0 }, [
        { name: 'foo', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 4, bar: 0 }, [
        { name: 'foo', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, bar: 0, stuff: 0 }, [
        { name: 'foo', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, bar: 0, stuff: 1 }, [
        { name: 'foo', optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(true);
  });
});

describe('matchContextPropertyTarget with optional argument', () => {
  it('returns true if its optional argument are here', () => {
    expect(
      matchContextPropertyTarget({ foo: 1, bar: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, bar: 1, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ bar: 1 }, [{ name: 'bar', optional: true }]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ bar: 1, stuff: 0 }, [
        { name: 'bar', optional: true },
      ]),
    ).toBe(true);
  });

  it('returns true if its optional argument are not here', () => {
    expect(
      matchContextPropertyTarget({ foo: 1, bar: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, bar: 0, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({}, [{ name: 'bar', optional: true }]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ stuff: 0 }, [
        { name: 'bar', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ bar: 0 }, [{ name: 'bar', optional: true }]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ bar: 0, stuff: 0 }, [
        { name: 'bar', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ bar: 0, foo: 1 }, [
        { name: 'bar', optional: true },
        { name: 'stuff', optional: true },
        { name: 'foo', optional: false },
      ]),
    ).toBe(true);
  });

  it('returns false if non optional arguments are not here', () => {
    expect(
      matchContextPropertyTarget({ foo: 0, bar: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ bar: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ bar: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 1, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 0, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ bar: 0, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ bar: 1, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);
  });

  it('returns false if there is there are values not in the arguments', () => {
    expect(
      matchContextPropertyTarget({ foo: 1, bar: 0, stuff: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 1, stuff: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ stuff: 1 }, [
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ bar: 0, stuff: 1 }, [
        { name: 'bar', optional: true },
      ]),
    ).toBe(false);
  });
});

describe('matchContextPropertyTarget with wildcase', () => {
  it('Returns true if there is one non target value and wildcase is not optional', () => {
    expect(
      matchContextPropertyTarget({ foo: 1 }, [
        { name: WILD_CASE, optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, bar: 1 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, bar: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: false },
      ]),
    ).toBe(true);
  });

  it('Returns true if there is more than one non target value and wildcase is not optional', () => {
    expect(
      matchContextPropertyTarget({ foo: 1, foo2: 1 }, [
        { name: WILD_CASE, optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, foo2: 1, bar: 1 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, foo2: 1, bar: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 1, foo2: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: false },
      ]),
    ).toBe(true);
  });

  it('Returns false if there is not any non target value and wildcase is not optional', () => {
    expect(
      matchContextPropertyTarget({}, [{ name: WILD_CASE, optional: false }]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0 }, [
        { name: WILD_CASE, optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ bar: 1 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 1 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ bar: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0, stuff: 0 }, [
        { name: WILD_CASE, optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ stuff: 0 }, [
        { name: WILD_CASE, optional: false },
      ]),
    ).toBe(false);
  });
  it('Returns false if there is not any non target value and wildcase is not optional', () => {
    expect(
      matchContextPropertyTarget({}, [{ name: WILD_CASE, optional: false }]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0 }, [
        { name: WILD_CASE, optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ bar: 1 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 1 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ bar: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0, stuff: 0 }, [
        { name: WILD_CASE, optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ stuff: 0 }, [
        { name: WILD_CASE, optional: false },
      ]),
    ).toBe(false);
  });

  it(
    'Returns false if there is not any non target value (including optional targets) and wildcase is' +
      ' not optional',
    () => {
      expect(
        matchContextPropertyTarget({ foo: 0, bar: 1, stuff: 1 }, [
          { name: WILD_CASE, optional: false },
          { name: 'stuff', optional: true },
          { name: 'bar', optional: false },
        ]),
      ).toBe(false);
    },
  );

  it('Returns false if there is a target that is not here with non optional wildcase', () => {
    expect(
      matchContextPropertyTarget({ bar: 0, foo: 1 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 1 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({}, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0 }, [
        { name: WILD_CASE, optional: false },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);
  });

  it('Returns true if wildcase is optional and there is no additional targets', () => {
    expect(
      matchContextPropertyTarget({}, [{ name: WILD_CASE, optional: true }]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 0 }, [
        { name: WILD_CASE, optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 0, stuff: 0 }, [
        { name: WILD_CASE, optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ stuff: 1 }, [
        { name: WILD_CASE, optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ stuff: 1, foo: 1 }, [
        { name: WILD_CASE, optional: true },
      ]),
    ).toBe(true);
  });

  it('Returns true if wildcase is optional and all targets are here', () => {
    expect(
      matchContextPropertyTarget({ bar: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ bar: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
      ]),
    ).toBe(true);

    // with optional target
    expect(
      matchContextPropertyTarget({ bar: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ bar: 1, stuff: 0 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: true },
      ]),
    ).toBe(true);

    expect(
      matchContextPropertyTarget({ foo: 0, bar: 1, stuff: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: true },
      ]),
    ).toBe(true);
  });

  it('Returns false if there is a target that is not here with optional wildcase', () => {
    expect(
      matchContextPropertyTarget({ bar: 0, foo: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({}, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
      ]),
    ).toBe(false);

    // with one more
    expect(
      matchContextPropertyTarget({ bar: 0, foo: 1, stuff: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 1, stuff: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ stuff: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(false);

    expect(
      matchContextPropertyTarget({ foo: 0, stuff: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(false);
  });
});

describe('matchContextPropertyTarget with doublons', () => {
  it('remain consistent for non optional values', () => {
    expect(
      matchContextPropertyTarget({ foo: 1, stuff: 1 }, [
        { name: 'foo', optional: false },
        { name: 'foo', optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(true);
    expect(
      matchContextPropertyTarget({ foo: 0, stuff: 1 }, [
        { name: 'foo', optional: false },
        { name: 'foo', optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(false);
  });
  it('remain consistent for optional values', () => {
    expect(
      matchContextPropertyTarget({ foo: 1, stuff: 1 }, [
        { name: 'foo', optional: true },
        { name: 'foo', optional: true },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(true);
    expect(
      matchContextPropertyTarget({ foo: 0, stuff: 1 }, [
        { name: 'foo', optional: true },
        { name: 'foo', optional: true },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(true);
  });
  it('remain consistent with mixed of optional and non values', () => {
    expect(
      matchContextPropertyTarget({ foo: 1, stuff: 1 }, [
        { name: 'foo', optional: true },
        { name: 'foo', optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(true);
    expect(
      matchContextPropertyTarget({ foo: 0, stuff: 1 }, [
        { name: 'foo', optional: true },
        { name: 'foo', optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(false);
  });
  it('remain consistent for wildcase', () => {
    expect(
      matchContextPropertyTarget({ foo: 0, stuff: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: WILD_CASE, optional: true },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(true);
    expect(
      matchContextPropertyTarget({ foo: 0, stuff: 1 }, [
        { name: WILD_CASE, optional: true },
        { name: WILD_CASE, optional: false },
        { name: 'stuff', optional: false },
      ]),
    ).toBe(false);
  });
});

describe('matchContextProperty', () => {
  it('returns true if one of the group matches', () => {
    expect(
      matchContextProperty({ foo: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }],
      ]),
    ).toBe(true);

    expect(
      matchContextProperty({ bar: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }],
      ]),
    ).toBe(true);

    expect(
      matchContextProperty({ stuff: 1, foo: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }, { name: 'stuff', optional: false }],
      ]),
    ).toBe(true);

    expect(
      matchContextProperty({ bar: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }, { name: 'stuff', optional: false }],
      ]),
    ).toBe(true);
  });

  it('returns false if no group matches', () => {
    expect(
      matchContextProperty({ bar: 1, foo: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }],
      ]),
    ).toBe(false);

    expect(
      matchContextProperty({ bar: 1, foo: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }, { name: 'stuff', optional: false }],
      ]),
    ).toBe(false);
  });
});

describe('decodeContextProperty', () => {
  it('transforms arrays into dictionaries of counts', () => {
    expect(decodeContextProperty(['t1', 't2', 't3'])).toEqual({
      t1: 1,
      t2: 1,
      t3: 1,
    });
  });

  it('transforms strings into dictionaries of counts', () => {
    expect(decodeContextProperty('t1')).toEqual({ t1: 1 });
  });
});

describe('matchContext', () => {
  it('returns true when all context property targets have a match', () => {
    expect(
      matchContext(
        {
          contextProp1: 'cp12',
          contextProp2: 'cp21',
        },
        {
          contextProp1: 'cp11 | cp12 | cp13',
          contextProp2: 'cp21',
        },
      ),
    ).toBe(true);

    expect(
      matchContext(
        {
          contextProp1: 'cp12',
          contextProp2: ['cp21', 'cp22'],
        },
        {
          contextProp1: 'cp11 | cp12 | cp13',
          contextProp2: 'cp21 ( cp22 | cp23 )',
        },
      ),
    ).toBe(true);
  });

  it('returns false if there is at least one context property target without match', () => {
    expect(
      matchContext(
        {
          contextProp1: 'something else',
          contextProp2: 'cp21',
        },
        {
          contextProp1: 'cp11 | cp12 | cp13',
          contextProp2: 'cp21',
        },
      ),
    ).toBe(false);

    expect(
      matchContext(
        {
          contextProp1: 'cp12',
          contextProp2: ['cp21', 'cp22', 'dealBreaker'],
        },
        {
          contextProp1: 'cp11 | cp12 | cp13',
          contextProp2: 'cp21 ( cp22 | cp23 )',
        },
      ),
    ).toBe(false);
  });

  it('returns false if there is at least one target fully missing from the context', () => {
    expect(
      matchContext(
        {
          contextProp1: 'prop1val',
        },
        {
          contextProp1: 'prop1val',
          contextProp2: 'prop2val1 | prop2val2',
        },
      ),
    ).toBe(false);

    expect(
      matchContext(
        {
          contextProp1: 'prop1val',
        },
        {
          contextProp1: 'prop1val',
          contextProp2: WILD_CASE,
        },
      ),
    ).toBe(false);
  });

  it('returns true if only optional targets are fully missing from the context', () => {
    expect(
      matchContext(
        {
          prop1: 'prop1val',
        },
        {
          prop1: 'prop1val',
          prop2: 'foo?',
        },
      ),
    ).toBe(true);

    expect(
      matchContext(
        {
          prop1: 'prop1val',
        },
        {
          prop1: 'prop1val',
          prop2: `${WILD_CASE}?`,
        },
      ),
    ).toBe(true);
  });
});
