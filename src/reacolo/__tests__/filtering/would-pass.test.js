import wouldPass, {
  valueGroupsFilter,
  valuesFilter,
  decodeContextVal
} from '../../filtering/would-pass';

const wildcase = '*';

describe('simple values filter', () => {
  it('returns true when there is one value > 0 corresponding to the sole provided target', () => {
    expect(valuesFilter({ foo: 1 }, [{ name: 'foo', optional: false }])).toBe(true);
    expect(valuesFilter({ foo: 3 }, [{ name: 'foo', optional: false }])).toBe(true);
  });

  it('returns false when there is no value > 0 and one target', () => {
    expect(valuesFilter({ foo: 0 }, [{ name: 'foo', optional: false }])).toBe(false);
    expect(valuesFilter({}, [{ name: 'foo', optional: false }])).toBe(false);
  });

  it('returns true when there is several targets, all with value > 0', () => {
    expect(
      valuesFilter({ bar: 4, foo: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ bar: 4, foo: 1, nope: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(true);

    expect(
      valuesFilter(
        {
          bar: 4,
          foo: 1,
          stuff: 1
        },
        [
          { name: 'foo', optional: false },
          { name: 'bar', optional: false },
          { name: 'stuff', optional: false }
        ]
      )
    ).toBe(true);
  });

  it('returns false when there is several targets and one of them has value = 0', () => {
    expect(
      valuesFilter({ bar: 4, foo: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter(
        {
          bar: 0,
          foo: 2,
          stuff: 1
        },
        [
          { name: 'foo', optional: false },
          { name: 'bar', optional: false },
          { name: 'stuff', optional: false }
        ]
      )
    ).toBe(false);
  });

  it('returns false when there is several targets and one of them is not here', () => {
    expect(
      valuesFilter({ foo: 1 }, [{ name: 'foo', optional: false }, { name: 'bar', optional: false }])
    ).toBe(false);

    expect(
      valuesFilter(
        {
          bar: 1,
          stuff: 4
        },
        [
          { name: 'foo', optional: false },
          { name: 'bar', optional: false },
          { name: 'stuff', optional: false }
        ]
      )
    ).toBe(false);
  });

  it('returns false when there is several targets and none are here', () => {
    expect(
      valuesFilter({}, [{ name: 'foo', optional: false }, { name: 'bar', optional: false }])
    ).toBe(false);

    expect(
      valuesFilter({ bar: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(false);
  });

  it('returns false when there is extraneous values', () => {
    expect(
      valuesFilter(
        {
          foo: 1,
          bar: 1
        },
        [{ name: 'bar', optional: false }]
      )
    ).toBe(false);

    expect(
      valuesFilter(
        {
          foo: 2,
          bar: 2,
          stuff: 0
        },
        [{ name: 'bar', optional: false }]
      )
    ).toBe(false);

    expect(
      valuesFilter(
        {
          foo: 2,
          bar: 2,
          stuff: 1
        },
        [{ name: 'bar', optional: false }, { name: 'stuff', optional: false }]
      )
    ).toBe(false);
  });

  it('returns true when there is several values but only the target(s) are > 0', () => {
    expect(valuesFilter({ foo: 1, bar: 0 }, [{ name: 'foo', optional: false }])).toBe(true);

    expect(valuesFilter({ foo: 4, bar: 0 }, [{ name: 'foo', optional: false }])).toBe(true);

    expect(valuesFilter({ foo: 1, bar: 0, stuff: 0 }, [{ name: 'foo', optional: false }])).toBe(
      true
    );

    expect(
      valuesFilter({ foo: 1, bar: 0, stuff: 1 }, [
        { name: 'foo', optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(true);
  });
});

describe('values filter with facultative argument', () => {
  it('returns true if its facultative argument are here', () => {
    expect(
      valuesFilter({ foo: 1, bar: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ foo: 1, bar: 1, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(true);

    expect(valuesFilter({ bar: 1 }, [{ name: 'bar', optional: true }])).toBe(true);

    expect(valuesFilter({ bar: 1, stuff: 0 }, [{ name: 'bar', optional: true }])).toBe(true);
  });

  it('returns true if its facultative argument are not here', () => {
    expect(
      valuesFilter({ foo: 1, bar: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ foo: 1, bar: 0, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ foo: 1 }, [{ name: 'foo', optional: false }, { name: 'bar', optional: true }])
    ).toBe(true);

    expect(
      valuesFilter({ foo: 1, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(true);

    expect(valuesFilter({}, [{ name: 'bar', optional: true }])).toBe(true);

    expect(valuesFilter({ stuff: 0 }, [{ name: 'bar', optional: true }])).toBe(true);

    expect(valuesFilter({ bar: 0 }, [{ name: 'bar', optional: true }])).toBe(true);

    expect(valuesFilter({ bar: 0, stuff: 0 }, [{ name: 'bar', optional: true }])).toBe(true);

    expect(
      valuesFilter({ bar: 0, foo: 1 }, [
        { name: 'bar', optional: true },
        { name: 'stuff', optional: true },
        { name: 'foo', optional: false }
      ])
    ).toBe(true);
  });

  it('returns false if non facultative arguments are not here', () => {
    expect(
      valuesFilter({ foo: 0, bar: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 0, bar: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ bar: 0 }, [{ name: 'foo', optional: false }, { name: 'bar', optional: true }])
    ).toBe(false);

    expect(
      valuesFilter({ bar: 1 }, [{ name: 'foo', optional: false }, { name: 'bar', optional: true }])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 0, bar: 1, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 0, bar: 0, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ bar: 0, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ bar: 1, stuff: 0 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(false);
  });

  it('returns false if there is there are values not in the arguments', () => {
    expect(
      valuesFilter({ foo: 1, bar: 0, stuff: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 1, stuff: 1 }, [
        { name: 'foo', optional: false },
        { name: 'bar', optional: true }
      ])
    ).toBe(false);

    expect(valuesFilter({ stuff: 1 }, [{ name: 'bar', optional: true }])).toBe(false);

    expect(valuesFilter({ bar: 0, stuff: 1 }, [{ name: 'bar', optional: true }])).toBe(false);
  });
});

describe('values filter with * target', () => {
  it('Returns true if there is one non target value and * is not optional', () => {
    expect(valuesFilter({ foo: 1 }, [{ name: wildcase, optional: false }])).toBe(true);

    expect(
      valuesFilter({ foo: 1, bar: 1 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ foo: 1, bar: 1, stuff: 0 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(true);

    expect(valuesFilter({ foo: 1, stuff: 0 }, [{ name: wildcase, optional: false }])).toBe(true);
  });

  it('Returns true if there is more than one non target value and * is not optional', () => {
    expect(valuesFilter({ foo: 1, foo2: 1 }, [{ name: wildcase, optional: false }])).toBe(true);

    expect(
      valuesFilter({ foo: 1, foo2: 1, bar: 1 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ foo: 1, foo2: 1, bar: 1, stuff: 0 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(true);

    expect(valuesFilter({ foo: 1, foo2: 1, stuff: 0 }, [{ name: wildcase, optional: false }])).toBe(
      true
    );
  });

  it('Returns false if there is not any non target value and * is not optional', () => {
    expect(valuesFilter({}, [{ name: wildcase, optional: false }])).toBe(false);

    expect(valuesFilter({ foo: 0 }, [{ name: wildcase, optional: false }])).toBe(false);

    expect(
      valuesFilter({ bar: 1 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 0, bar: 1 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ bar: 1, stuff: 0 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 0, bar: 1, stuff: 0 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(valuesFilter({ foo: 0, stuff: 0 }, [{ name: wildcase, optional: false }])).toBe(false);

    expect(valuesFilter({ stuff: 0 }, [{ name: wildcase, optional: false }])).toBe(false);
  });
  it('Returns false if there is not any non target value and * is not optional', () => {
    expect(valuesFilter({}, [{ name: wildcase, optional: false }])).toBe(false);

    expect(valuesFilter({ foo: 0 }, [{ name: wildcase, optional: false }])).toBe(false);

    expect(
      valuesFilter({ bar: 1 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 0, bar: 1 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ bar: 1, stuff: 0 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 0, bar: 1, stuff: 0 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(valuesFilter({ foo: 0, stuff: 0 }, [{ name: wildcase, optional: false }])).toBe(false);

    expect(valuesFilter({ stuff: 0 }, [{ name: wildcase, optional: false }])).toBe(false);
  });

  it(
    'Returns false if there is not any non target value (including optional targets) and * is' +
      ' not optional',
    () => {
      expect(
        valuesFilter({ foo: 0, bar: 1, stuff: 1 }, [
          { name: wildcase, optional: false },
          { name: 'stuff', optional: true },
          { name: 'bar', optional: false }
        ])
      ).toBe(false);
    }
  );

  it('Returns false if there is a target that is not here with non optional *', () => {
    expect(
      valuesFilter({ bar: 0, foo: 1 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 1 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({}, [{ name: wildcase, optional: false }, { name: 'bar', optional: false }])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 0 }, [
        { name: wildcase, optional: false },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);
  });

  it('Returns true if * is optional and there is no additional targets', () => {
    expect(valuesFilter({}, [{ name: wildcase, optional: true }])).toBe(true);

    expect(valuesFilter({ foo: 0 }, [{ name: wildcase, optional: true }])).toBe(true);

    expect(valuesFilter({ foo: 0, stuff: 0 }, [{ name: wildcase, optional: true }])).toBe(true);

    expect(valuesFilter({ stuff: 1 }, [{ name: wildcase, optional: true }])).toBe(true);

    expect(valuesFilter({ stuff: 1, foo: 1 }, [{ name: wildcase, optional: true }])).toBe(true);
  });

  it('Returns true if * is optional and all targets are here', () => {
    expect(
      valuesFilter({ bar: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ foo: 0, bar: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ bar: 1, stuff: 0 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ foo: 0, bar: 1, stuff: 0 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false }
      ])
    ).toBe(true);

    // with optional target
    expect(
      valuesFilter({ bar: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: true }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ foo: 0, bar: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: true }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ bar: 1, stuff: 0 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: true }
      ])
    ).toBe(true);

    expect(
      valuesFilter({ foo: 0, bar: 1, stuff: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: true }
      ])
    ).toBe(true);
  });

  it('Returns false if there is a target that is not here with optional *', () => {
    expect(
      valuesFilter({ bar: 0, foo: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({}, [{ name: wildcase, optional: true }, { name: 'bar', optional: false }])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 0 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false }
      ])
    ).toBe(false);

    // with one more
    expect(
      valuesFilter({ bar: 0, foo: 1, stuff: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 1, stuff: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ stuff: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(false);

    expect(
      valuesFilter({ foo: 0, stuff: 1 }, [
        { name: wildcase, optional: true },
        { name: 'bar', optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(false);
  });
});

describe('Doublons', () => {
  it('remain consistent for non optional values', () => {
    expect(
      valuesFilter({ foo: 1, stuff: 1 }, [
        { name: 'foo', optional: false },
        { name: 'foo', optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(true);
    expect(
      valuesFilter({ foo: 0, stuff: 1 }, [
        { name: 'foo', optional: false },
        { name: 'foo', optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(false);
  });
  it('remain consistent for optional values', () => {
    expect(
      valuesFilter({ foo: 1, stuff: 1 }, [
        { name: 'foo', optional: true },
        { name: 'foo', optional: true },
        { name: 'stuff', optional: false }
      ])
    ).toBe(true);
    expect(
      valuesFilter({ foo: 0, stuff: 1 }, [
        { name: 'foo', optional: true },
        { name: 'foo', optional: true },
        { name: 'stuff', optional: false }
      ])
    ).toBe(true);
  });
  it('remain consistent with mixed of optional and non values', () => {
    expect(
      valuesFilter({ foo: 1, stuff: 1 }, [
        { name: 'foo', optional: true },
        { name: 'foo', optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(true);
    expect(
      valuesFilter({ foo: 0, stuff: 1 }, [
        { name: 'foo', optional: true },
        { name: 'foo', optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(false);
  });
  it('remain consistent for *', () => {
    expect(
      valuesFilter({ foo: 0, stuff: 1 }, [
        { name: wildcase, optional: true },
        { name: wildcase, optional: true },
        { name: 'stuff', optional: false }
      ])
    ).toBe(true);
    expect(
      valuesFilter({ foo: 0, stuff: 1 }, [
        { name: wildcase, optional: true },
        { name: wildcase, optional: false },
        { name: 'stuff', optional: false }
      ])
    ).toBe(false);
  });
});

describe('values filter groups', () => {
  it('returns true if one of the group matches', () => {
    expect(
      valueGroupsFilter({ foo: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }]
      ])
    ).toBe(true);

    expect(
      valueGroupsFilter({ bar: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }]
      ])
    ).toBe(true);

    expect(
      valueGroupsFilter({ stuff: 1, foo: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }, { name: 'stuff', optional: false }]
      ])
    ).toBe(true);

    expect(
      valueGroupsFilter({ bar: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }, { name: 'stuff', optional: false }]
      ])
    ).toBe(true);
  });

  it('returns false if no group matches', () => {
    expect(
      valueGroupsFilter({ bar: 1, foo: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }]
      ])
    ).toBe(false);

    expect(
      valueGroupsFilter({ bar: 1, foo: 1 }, [
        [{ name: 'bar', optional: false }],
        [{ name: 'foo', optional: false }, { name: 'stuff', optional: false }]
      ])
    ).toBe(false);
  });
});

describe('decodeContextVal', () => {
  it('transforms arrays into dictionnaries of counts', () => {
    expect(decodeContextVal(['t1', 't2', 't3'])).toEqual({
      t1: 1,
      t2: 1,
      t3: 1
    });
  });

  it('transforms strings into dictionnaries of counts', () => {
    expect(decodeContextVal('t1')).toEqual({ t1: 1 });
  });
});

describe('wouldPass', () => {
  it('returns true when all context property targets have a match', () => {
    expect(
      wouldPass(
        {
          contextProp1: 'cp12',
          contextProp2: 'cp21'
        },
        {
          contextProp1: 'cp11 | cp12 | cp13',
          contextProp2: 'cp21'
        }
      )
    ).toBe(true);

    expect(
      wouldPass(
        {
          contextProp1: 'cp12',
          contextProp2: ['cp21', 'cp22']
        },
        {
          contextProp1: 'cp11 | cp12 | cp13',
          contextProp2: 'cp21 ( cp22 | cp23 )'
        }
      )
    ).toBe(true);
  });

  it('returns false if there is at least one context property target without match', () => {
    expect(
      wouldPass(
        {
          contextProp1: 'something else',
          contextProp2: 'cp21'
        },
        {
          contextProp1: 'cp11 | cp12 | cp13',
          contextProp2: 'cp21'
        }
      )
    ).toBe(false);

    expect(
      wouldPass(
        {
          contextProp1: 'cp12',
          contextProp2: ['cp21', 'cp22', 'dealBreaker']
        },
        {
          contextProp1: 'cp11 | cp12 | cp13',
          contextProp2: 'cp21 ( cp22 | cp23 )'
        }
      )
    ).toBe(false);
  });

  it('returns false if there is at least one target fully missing from the context', () => {
    expect(
      wouldPass(
        {
          contextProp1: 'prop1val'
        },
        {
          contextProp1: 'prop1val',
          contextProp2: 'prop2val1 | prop2val2'
        }
      )
    ).toBe(false);

    expect(
      wouldPass(
        {
          contextProp1: 'prop1val'
        },
        {
          contextProp1: 'prop1val',
          contextProp2: '*'
        }
      )
    ).toBe(false);
  });

  it('returns true if only optional targets are fully missing from the context', () => {
    expect(
      wouldPass(
        {
          prop1: 'prop1val'
        },
        {
          prop1: 'prop1val',
          prop2: 'foo?'
        }
      )
    ).toBe(true);

    expect(
      wouldPass(
        {
          prop1: 'prop1val'
        },
        {
          prop1: 'prop1val',
          prop2: '*?'
        }
      )
    ).toBe(true);
  });
});
