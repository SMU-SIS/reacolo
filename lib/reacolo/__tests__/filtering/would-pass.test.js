import wouldRender, { valueGroupsFilter, valuesFilter } from '../../filtering/would-pass';

const wildcase = '*';

describe('simple values filter', () => {
  it('returns true when there is one value > 0 corresponding to the sole provided target', () => {
    expect(valuesFilter(
      { foo: 1 },
      { foo: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 3 },
      { foo: { optional: false } }
    )).toBe(true);
  });
  it('returns false when there is no value > 0 and one target', () => {
    expect(valuesFilter(
      { foo: 0 },
      { foo: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      {},
      { foo: { optional: false } }
    )).toBe(false);
  });
  it('returns true when there is several targets, all with value > 0', () => {
    expect(valuesFilter(
      { bar: 4,
        foo: 1 },
      { foo: { optional: false },
        bar: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { bar: 4,
        foo: 1,
        nope: 0 },
      { foo: { optional: false },
        bar: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { bar: 4,
        foo: 1,
        stuff: 1 },
      { foo: { optional: false },
        bar: { optional: false },
        stuff: { optional: false } }
    )).toBe(true);
  });
  it('returns false when there is several targets and one of them has value = 0', () => {
    expect(valuesFilter(
      { bar: 4,
        foo: 0 },
      { foo: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 0,
        foo: 2,
        stuff: 1 },
      { foo: { optional: false },
        bar: { optional: false },
        stuff: { optional: false } }
    )).toBe(false);
  });
  it('returns false when there is several targets and one of them is not here', () => {
    expect(valuesFilter(
      { foo: 1 },
      { foo: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 1,
        stuff: 4 },
      { foo: { optional: false },
        bar: { optional: false },
        stuff: { optional: false } }
    )).toBe(false);
  });
  it('returns false when there is several targets and none are here', () => {
    expect(valuesFilter(
      {},
      { foo: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 0 },
      { foo: { optional: false },
        bar: { optional: false },
        stuff: { optional: false } }
    )).toBe(false);
  });
  it('returns false when there is extraneous values', () => {
    expect(valuesFilter(
      { foo: 1,
        bar: 1 },
      { bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 2,
        bar: 2,
        stuff: 0 },
      { bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 2, bar: 2, stuff: 1 },
      { bar: { optional: false },
        stuff: { optional: false } }
    )).toBe(false);
  });
  it('returns true when there is several values but only the target(s) are > 0', () => {
    expect(valuesFilter(
      { foo: 1, bar: 0 },
      { foo: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 4, bar: 0 },
      { foo: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, bar: 0, stuff: 0 },
      { foo: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, bar: 0, stuff: 1 },
      { foo: { optional: false },
        stuff: { optional: false } }
    )).toBe(true);
  });
});

describe('values filter with facultative argument', () => {
  it('returns true if its facultative argument are here', () => {
    expect(valuesFilter(
      { foo: 1, bar: 1 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, bar: 1, stuff: 0 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { bar: 1 },
      { bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { bar: 1, stuff: 0 },
      { bar: { optional: true } }
    )).toBe(true);
  });
  it('returns true if its facultative argument are not here', () => {
    expect(valuesFilter(
      { foo: 1, bar: 0 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, bar: 0, stuff: 0 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, stuff: 0 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      {},
      { bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { stuff: 0 },
      { bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { bar: 0 },
      { bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { bar: 0, stuff: 0 },
      { bar: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { bar: 0, foo: 1 },
      { bar: { optional: true },
        stuff: { optional: true },
        foo: { optional: false } }
    )).toBe(true);
  });
  it('returns false if non facultative arguments are not here', () => {
    expect(valuesFilter(
      { foo: 0, bar: 1 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0, bar: 0 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 0 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 1 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0, bar: 1, stuff: 0 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0, bar: 0, stuff: 0 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 0, stuff: 0 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 1, stuff: 0 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(false);
  });
  it('returns false if there is there are values not in the arguments', () => {
    expect(valuesFilter(
      { foo: 1, bar: 0, stuff: 1 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 1, stuff: 1 },
      { foo: { optional: false },
        bar: { optional: true } }
    )).toBe(false);
    expect(valuesFilter(
      { stuff: 1 },
      { bar: { optional: true } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 0, stuff: 1 },
      { bar: { optional: true } }
    )).toBe(false);
  });
});

describe('values filter with * target', () => {
  it('Returns true if there is one non target value and * is not optional', () => {
    expect(valuesFilter(
      { foo: 1 },
      { [wildcase]: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, bar: 1 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, bar: 1, stuff: 0 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, stuff: 0 },
      { [wildcase]: { optional: false } }
    )).toBe(true);
  });
  it('Returns true if there is more than one non target value and * is not optional', () => {
    expect(valuesFilter(
      { foo: 1, foo2: 1 },
      { [wildcase]: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, foo2: 1, bar: 1 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, foo2: 1, bar: 1, stuff: 0 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 1, foo2: 1, stuff: 0 },
      { [wildcase]: { optional: false } }
    )).toBe(true);
  });
  it('Returns false if there is not any non target value and * is not optional', () => {
    expect(valuesFilter(
      { },
      { [wildcase]: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0 },
      { [wildcase]: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 1 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0, bar: 1 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 1, stuff: 0 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0, bar: 1, stuff: 0 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0, stuff: 0 },
      { [wildcase]: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { stuff: 0 },
      { [wildcase]: { optional: false } }
    )).toBe(false);
  });
  it('Returns false if there is not any non target value and * is not optional', () => {
    expect(valuesFilter(
      { },
      { [wildcase]: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0 },
      { [wildcase]: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 1 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0, bar: 1 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { bar: 1, stuff: 0 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0, bar: 1, stuff: 0 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0, stuff: 0 },
      { [wildcase]: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { stuff: 0 },
      { [wildcase]: { optional: false } }
    )).toBe(false);
  });
  it('Returns false if there is not any non target value (including optional targets) and * is not optional', () => {
    expect(valuesFilter(
      { foo: 0, bar: 1, stuff: 1 },
      { [wildcase]: { optional: false },
        stuff: { optional: true },
        bar: { optional: false } }
    )).toBe(false);
  });
  it('Returns false if there is a target that is not here with non optional *', () => {
    expect(valuesFilter(
      { bar: 0, foo: 1 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 1 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      {},
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0 },
      { [wildcase]: { optional: false },
        bar: { optional: false } }
    )).toBe(false);
  });
  it('Returns true if * is optional and there is no additional targets', () => {
    expect(valuesFilter(
      { },
      { [wildcase]: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 0 },
      { [wildcase]: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 0, stuff: 0 },
      { [wildcase]: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { stuff: 1 },
      { [wildcase]: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { stuff: 1, foo: 1 },
      { [wildcase]: { optional: true } }
    )).toBe(true);
  });
  it('Returns true if * is optional and all targets are here', () => {
    expect(valuesFilter(
      { bar: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 0, bar: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { bar: 1, stuff: 0 },
      { [wildcase]: { optional: true },
        bar: { optional: false } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 0, bar: 1, stuff: 0 },
      { [wildcase]: { optional: true },
        bar: { optional: false } }
    )).toBe(true);
    // with optional target
    expect(valuesFilter(
      { bar: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false },
        stuff: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 0, bar: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false },
        stuff: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { bar: 1, stuff: 0 },
      { [wildcase]: { optional: true },
        bar: { optional: false },
        stuff: { optional: true } }
    )).toBe(true);
    expect(valuesFilter(
      { foo: 0, bar: 1, stuff: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false },
        stuff: { optional: true } }
    )).toBe(true);
  });
  it('Returns false if there is a target that is not here with optional *', () => {
    expect(valuesFilter(
      { bar: 0, foo: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      {},
      { [wildcase]: { optional: true },
        bar: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0 },
      { [wildcase]: { optional: true },
        bar: { optional: false } }
    )).toBe(false);
    // with one more
    expect(valuesFilter(
      { bar: 0, foo: 1, stuff: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false },
        stuff: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 1, stuff: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false },
        stuff: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { stuff: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false },
        stuff: { optional: false } }
    )).toBe(false);
    expect(valuesFilter(
      { foo: 0, stuff: 1 },
      { [wildcase]: { optional: true },
        bar: { optional: false },
        stuff: { optional: false } }
    )).toBe(false);
  });
});

describe('values filter groups', () => {
  it('returns true if one of the group matches', () => {
    expect(valueGroupsFilter(
      { foo: 1 },
      [
        { bar: { optional: false } },
        { foo: { optional: false } }
      ]
    )).toBe(true);
    expect(valueGroupsFilter(
      { bar: 1 },
      [
        { bar: { optional: false } },
        { foo: { optional: false } }
      ]
    )).toBe(true);
    expect(valueGroupsFilter(
      { stuff: 1, foo: 1 },
      [
        { bar: { optional: false } },
        { foo: { optional: false }, stuff: { optional: false } }
      ]
    )).toBe(true);
    expect(valueGroupsFilter(
      { bar: 1 },
      [
        { bar: { optional: false } },
        { foo: { optional: false }, stuff: { optional: false } }
      ]
    )).toBe(true);
  });
  it('returns false if no group matches', () => {
    expect(valueGroupsFilter(
      { bar: 1, foo: 1 },
      [
        { bar: { optional: false } },
        { foo: { optional: false } }
      ]
    )).toBe(false);
    expect(valueGroupsFilter(
      { bar: 1, foo: 1 },
      [
        { bar: { optional: false } },
        { foo: { optional: false }, stuff: { optional: false } }
      ]
    )).toBe(false);
  });
});

describe('wouldRender', () => {
  it('returns true when all context property targets have a match', () => {
    expect(wouldRender({
      contextProp1: 'cp12',
      contextProp2: 'cp21'
    }, {
      contextProp1: 'cp11 | cp12 | cp13',
      contextProp2: 'cp21'
    })).toBe(true);
    expect(wouldRender({
      contextProp1: 'cp12',
      contextProp2: {
        cp21: 1,
        cp22: 1
      }
    }, {
      contextProp1: 'cp11 | cp12 | cp13',
      contextProp2: 'cp21 ( cp22 | cp23 )'
    })).toBe(true);
  });
  it('it returns false if there is at lest one context property target without match', () => {
    expect(wouldRender({
      contextProp1: 'something else',
      contextProp2: 'cp21'
    }, {
      contextProp1: 'cp11 | cp12 | cp13',
      contextProp2: 'cp21'
    })).toBe(false);
    expect(wouldRender({
      contextProp1: 'cp12',
      contextProp2: {
        cp21: 1,
        cp22: 1,
        dealBreaker: 1
      }
    }, {
      contextProp1: 'cp11 | cp12 | cp13',
      contextProp2: 'cp21 ( cp22 | cp23 )'
    })).toBe(false);
  });
});
