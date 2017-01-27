import { valueFilter, countFilter } from '../reacolo/context-filter';

describe('value filter', () => {
  it('returns true when there is one target and it is the value', () => {
    expect(valueFilter('foo', 'foo')).toBe(true);
  });
  it('returns false when there is one target and it is not the value', () => {
    expect(valueFilter('foo', 'bar')).toBe(false);
  });
  it('returns true when the value is included in the targets', () => {
    expect(valueFilter('foo', 'bar|foo|stuff')).toBe(true);
  });
  it('returns false when the value is not included in the targets', () => {
    expect(valueFilter('something-else', 'bar|foo|stuff')).toBe(false);
  });
  it('returns true if there is no target', () => {
    expect(valueFilter('foo', '')).toBe(true);
    expect(valueFilter('foo')).toBe(true);
    expect(valueFilter()).toBe(true);
    expect(valueFilter(undefined, '')).toBe(true);
  });
  it('returns true if the target is * and there is a non undefined value', () => {
    expect(valueFilter('foo', '*')).toBe(true);
  });
  it('returns true if one of the targets is * and there is a non undefined value', () => {
    expect(valueFilter('foo', 'whatever|*')).toBe(true);
  });
  it('returns false if there is a target (including *) but no value', () => {
    expect(valueFilter('', 'whatever')).toBe(false);
    expect(valueFilter('', '*')).toBe(false);
    expect(valueFilter('', 'bar|foo')).toBe(false);
    expect(valueFilter('', 'bar|*')).toBe(false);
    expect(valueFilter(undefined, 'whatever')).toBe(false);
    expect(valueFilter(undefined, '*')).toBe(false);
    expect(valueFilter(undefined, 'bar|foo')).toBe(false);
    expect(valueFilter(undefined, 'bar|*')).toBe(false);
  });
});

describe('simple count filter', () => {
  it('returns true when there is one count > 0 corresponding to the sole provided target', () => {
    expect(countFilter({ foo: 1 }, 'foo')).toBe(true);
  });
  it('returns false when there is one count = 0 corresponding to the sole provided target', () => {
    expect(countFilter({ foo: 0 }, 'foo')).toBe(false);
  });
  it('returns false when there is one target but no count', () => {
    expect(countFilter({}, 'foo')).toBe(false);
  });
  it('returns true when there is several targets, all with count > 0', () => {
    expect(countFilter({ bar: 4, foo: 1 }, 'foo & bar')).toBe(true);
    expect(countFilter({ bar: 4, foo: 1, nope: 0 }, 'foo & bar')).toBe(true);
    expect(countFilter({ bar: 4, foo: 1, stuff: 1 }, 'foo & bar & stuff')).toBe(true);
  });
  it('returns false when there is several targets and one of them has count = 0', () => {
    expect(countFilter({ bar: 4, foo: 0 }, 'foo & bar')).toBe(false);
    expect(countFilter({ bar: 0, foo: 1 }, 'foo & bar')).toBe(false);
  });
  it('returns false when there is several targets and one of them is not here', () => {
    expect(countFilter({ foo: 1 }, 'foo & bar')).toBe(false);
    expect(countFilter({ bar: 1 }, 'foo & bar')).toBe(false);
  });
  it('returns false when there is several targets and none are here', () => {
    expect(countFilter({}, 'foo & bar')).toBe(false);
    expect(countFilter({}, 'foo & bar & tuff')).toBe(false);
  });
  it('returns false when there is several counts but only one target', () => {
    expect(countFilter({ foo: 1, bar: 1 }, 'foo')).toBe(false);
    expect(countFilter({ foo: 2, bar: 2, stuff: 0 }, 'bar')).toBe(false);
    expect(countFilter({ foo: 2, bar: 2, stuff: 1 }, 'bar')).toBe(false);
  });
  it('returns true when there is several counts but only the target is > 0', () => {
    expect(countFilter({ foo: 1, bar: 0 }, 'foo')).toBe(true);
    expect(countFilter({ foo: 4, bar: 0 }, 'foo')).toBe(true);
    expect(countFilter({ foo: 1, bar: 0, stuff: 0 }, 'foo')).toBe(true);
  });
  it('returns false when there is non target counts', () => {
    expect(countFilter({ foo: 1, bar: 2, stuff: 1 }, 'foo & bar')).toBe(false);
    expect(countFilter({ foo: 1, bar: 1, stuff: 0 }, 'foo')).toBe(false);
    expect(countFilter({ bar: 4, stuff: 1 }, 'foo')).toBe(false);
    expect(countFilter({ bar: 1 }, 'foo')).toBe(false);
  });
});

describe('count filter with facultative argument', () => {
  it('returns true if its facultative argument are here', () => {
    expect(countFilter({ foo: 1, bar: 1 }, 'foo & bar?')).toBe(true);
    expect(countFilter({ foo: 1, bar: 1, stuff: 0 }, 'foo & bar?')).toBe(true);
    expect(countFilter({ bar: 1 }, 'bar?')).toBe(true);
    expect(countFilter({ bar: 1, stuff: 0 }, 'bar?')).toBe(true);
  });
  it('returns true if its facultative argument are not here', () => {
    expect(countFilter({ foo: 1, bar: 0 }, 'foo & bar?')).toBe(true);
    expect(countFilter({ foo: 1, bar: 0, stuff: 0 }, 'foo & bar?')).toBe(true);
    expect(countFilter({ foo: 1 }, 'foo & bar?')).toBe(true);
    expect(countFilter({ foo: 1, stuff: 0 }, 'foo & bar?')).toBe(true);
    expect(countFilter({ }, 'bar?')).toBe(true);
    expect(countFilter({ stuff: 0 }, 'bar?')).toBe(true);
    expect(countFilter({ bar: 0 }, 'bar?')).toBe(true);
    expect(countFilter({ bar: 0, stuff: 0 }, 'bar?')).toBe(true);
  });
  it('returns false if non facultative arguments are not here', () => {
    expect(countFilter({ foo: 0, bar: 1 }, 'foo & bar?')).toBe(false);
    expect(countFilter({ foo: 0, bar: 0 }, 'foo & bar?')).toBe(false);
    expect(countFilter({ bar: 0 }, 'foo & bar?')).toBe(false);
    expect(countFilter({ bar: 1 }, 'foo & bar?')).toBe(false);
    expect(countFilter({ foo: 0, bar: 1, stuff: 0 }, 'foo & bar?')).toBe(false);
    expect(countFilter({ foo: 0, bar: 0, stuff: 0 }, 'foo & bar?')).toBe(false);
    expect(countFilter({ bar: 0, stuff: 0 }, 'foo & bar?')).toBe(false);
    expect(countFilter({ bar: 1, stuff: 0 }, 'foo & bar?')).toBe(false);
  });
  it('returns false if there is there are counts not in the arguments', () => {
    expect(countFilter({ foo: 1, bar: 0, stuff: 1 }, 'foo & bar?')).toBe(false);
    expect(countFilter({ foo: 1, stuff: 1 }, 'foo & bar?')).toBe(false);
    expect(countFilter({ stuff: 1 }, 'bar?')).toBe(false);
    expect(countFilter({ bar: 0, stuff: 1 }, 'bar?')).toBe(false);
  });
});

describe('simple count filter', () => {
  it('returns true when there is one count > 0 corresponding to the sole provided target', () => {
    expect(countFilter({ foo: 1 }, 'foo')).toBe(true);
  });
  it('returns false when there is one count = 0 corresponding to the sole provided target', () => {
    expect(countFilter({ foo: 0 }, 'foo')).toBe(false);
  });
  it('returns false when there is one target but no count', () => {
    expect(countFilter({}, 'foo')).toBe(false);
  });
  it('returns true when there is several targets, all with count > 0', () => {
    expect(countFilter({ bar: 4, foo: 1 }, 'foo & bar')).toBe(true);
    expect(countFilter({ bar: 4, foo: 1, nope: 0 }, 'foo & bar')).toBe(true);
    expect(countFilter({ bar: 4, foo: 1, stuff: 1 }, 'foo & bar & stuff')).toBe(true);
  });
  it('returns false when there is several targets and one of them has count = 0', () => {
    expect(countFilter({ bar: 4, foo: 0 }, 'foo & bar')).toBe(false);
    expect(countFilter({ bar: 0, foo: 1 }, 'foo & bar')).toBe(false);
  });
  it('returns false when there is several targets and one of them is not here', () => {
    expect(countFilter({ foo: 1 }, 'foo & bar')).toBe(false);
    expect(countFilter({ bar: 1 }, 'foo & bar')).toBe(false);
  });
  it('returns false when there is several targets and none are here', () => {
    expect(countFilter({}, 'foo & bar')).toBe(false);
    expect(countFilter({}, 'foo & bar & tuff')).toBe(false);
  });
  it('returns false when there is several counts but only one target', () => {
    expect(countFilter({ foo: 1, bar: 1 }, 'foo')).toBe(false);
    expect(countFilter({ foo: 2, bar: 2, stuff: 0 }, 'bar')).toBe(false);
    expect(countFilter({ foo: 2, bar: 2, stuff: 1 }, 'bar')).toBe(false);
  });
  it('returns true when there is several counts but only the target is > 0', () => {
    expect(countFilter({ foo: 1, bar: 0 }, 'foo')).toBe(true);
    expect(countFilter({ foo: 4, bar: 0 }, 'foo')).toBe(true);
    expect(countFilter({ foo: 1, bar: 0, stuff: 0 }, 'foo')).toBe(true);
  });
  it('returns false when there is non target counts', () => {
    expect(countFilter({ foo: 1, bar: 2, stuff: 1 }, 'foo & bar')).toBe(false);
    expect(countFilter({ foo: 1, bar: 1, stuff: 0 }, 'foo')).toBe(false);
    expect(countFilter({ bar: 4, stuff: 1 }, 'foo')).toBe(false);
    expect(countFilter({ bar: 1 }, 'foo')).toBe(false);
  });
});

describe('count filter with * target', () => {
  it('Returns true if there is one non target count and * is not optional', () => {
    expect(countFilter({ foo: 1 }, '*')).toBe(true);
    expect(countFilter({ foo: 1, bar: 1 }, 'bar & *')).toBe(true);
    expect(countFilter({ foo: 1, bar: 1, stuff: 0 }, 'bar & *')).toBe(true);
    expect(countFilter({ foo: 1, stuff: 0 }, '*')).toBe(true);
  });
  it('Returns true if there is more than one non target count and * is not optional', () => {
    expect(countFilter({ foo: 1, foo2: 1 }, '*')).toBe(true);
    expect(countFilter({ foo: 1, foo2: 1, bar: 1 }, 'bar & *')).toBe(true);
    expect(countFilter({ foo: 1, foo2: 1, bar: 1, stuff: 0 }, 'bar & *')).toBe(true);
    expect(countFilter({ foo: 1, foo2: 1, stuff: 0 }, '*')).toBe(true);
  });
  it('Returns false if there is not any non target count and * is not optional', () => {
    expect(countFilter({ }, '*')).toBe(false);
    expect(countFilter({ foo: 0 }, '*')).toBe(false);
    expect(countFilter({ bar: 1 }, 'bar & *')).toBe(false);
    expect(countFilter({ foo: 0, bar: 1 }, 'bar & *')).toBe(false);
    expect(countFilter({ bar: 1, stuff: 0 }, 'bar & *')).toBe(false);
    expect(countFilter({ foo: 0, bar: 1, stuff: 0 }, 'bar & *')).toBe(false);
    expect(countFilter({ foo: 0, stuff: 0 }, '*')).toBe(false);
    expect(countFilter({ stuff: 0 }, '*')).toBe(false);
  });
  it('Returns false if there is not any non target count and * is not optional', () => {
    expect(countFilter({ }, '*')).toBe(false);
    expect(countFilter({ foo: 0 }, '*')).toBe(false);
    expect(countFilter({ bar: 1 }, 'bar & *')).toBe(false);
    expect(countFilter({ foo: 0, bar: 1 }, 'bar & *')).toBe(false);
    expect(countFilter({ bar: 1, stuff: 0 }, 'bar & *')).toBe(false);
    expect(countFilter({ foo: 0, bar: 1, stuff: 0 }, 'bar & *')).toBe(false);
    expect(countFilter({ foo: 0, stuff: 0 }, '*')).toBe(false);
    expect(countFilter({ stuff: 0 }, '*')).toBe(false);
  });
  it('Returns false if there is a target that is not here with non optional *', () => {
    // * last
    expect(countFilter({ bar: 0, foo: 1 }, 'bar & *')).toBe(false);
    expect(countFilter({ foo: 1 }, 'bar & *')).toBe(false);
    expect(countFilter({}, 'bar & *')).toBe(false);
    expect(countFilter({ foo: 0 }, 'bar & *')).toBe(false);
    // * first
    expect(countFilter({ bar: 0, foo: 1 }, '* & bar')).toBe(false);
    expect(countFilter({ foo: 1 }, '* & bar')).toBe(false);
    expect(countFilter({}, '* & bar')).toBe(false);
    expect(countFilter({ foo: 0 }, '* & bar')).toBe(false);
  });
  it('Returns true if * is optional and there is no additional targets', () => {
    expect(countFilter({ }, '*?')).toBe(true);
    expect(countFilter({ foo: 0 }, '*?')).toBe(true);
    expect(countFilter({ foo: 0, stuff: 0 }, '*?')).toBe(true);
    expect(countFilter({ stuff: 0 }, '*?')).toBe(true);
  });
  it('Returns true if * is optional and all targets are here', () => {
    // * last
    expect(countFilter({ bar: 1 }, 'bar & *?')).toBe(true);
    expect(countFilter({ foo: 0, bar: 1 }, 'bar & *?')).toBe(true);
    expect(countFilter({ bar: 1, stuff: 0 }, 'bar & *?')).toBe(true);
    expect(countFilter({ foo: 0, bar: 1, stuff: 0 }, 'bar & *?')).toBe(true);
    // * first
    expect(countFilter({ bar: 1 }, '*? & bar')).toBe(true);
    expect(countFilter({ foo: 0, bar: 1 }, '*? & bar')).toBe(true);
    expect(countFilter({ bar: 1, stuff: 0 }, '*? & bar')).toBe(true);
    expect(countFilter({ foo: 0, bar: 1, stuff: 0 }, '*? & bar')).toBe(true);
    // with optional target
    expect(countFilter({ bar: 1 }, '*? & bar & stuff?')).toBe(true);
    expect(countFilter({ foo: 0, bar: 1 }, '*? & bar & stuff?')).toBe(true);
    expect(countFilter({ bar: 1, stuff: 0 }, '*? & bar & stuff?')).toBe(true);
    expect(countFilter({ foo: 0, bar: 1, stuff: 0 }, '*? & bar & stuff?')).toBe(true);
  });
  it('Returns false if there is a target that is not here with optional *', () => {
    // * last
    expect(countFilter({ bar: 0, foo: 1 }, 'bar & *?')).toBe(false);
    expect(countFilter({ foo: 1 }, 'bar & *?')).toBe(false);
    expect(countFilter({}, 'bar & *?')).toBe(false);
    expect(countFilter({ foo: 0 }, 'bar & *?')).toBe(false);
    // * first
    expect(countFilter({ bar: 0, foo: 1 }, '*? & bar')).toBe(false);
    expect(countFilter({ foo: 1 }, '*? & bar')).toBe(false);
    expect(countFilter({}, '*? & bar')).toBe(false);
    expect(countFilter({ foo: 0 }, '*? & bar')).toBe(false);
    // with one more
    expect(countFilter({ bar: 0, foo: 1, stuff: 1 }, 'bar & *? & stuff')).toBe(false);
    expect(countFilter({ foo: 1, stuff: 1 }, 'bar & *? & stuff')).toBe(false);
    expect(countFilter({ stuff: 1 }, 'bar & *? & stuff')).toBe(false);
    expect(countFilter({ foo: 0, stuff: 1 }, 'bar & *? & stuff')).toBe(false);
  });
});

describe('count filter with multiple target groups', () => {
  expect(countFilter({ foo: 1 }, 'bar | foo')).toBe(true);
  expect(countFilter({ bar: 1 }, 'bar | foo')).toBe(true);
  expect(countFilter({ bar: 1, foo: 1 }, 'bar | foo')).toBe(false);
  expect(countFilter({ bar: 1, foo: 1 }, 'bar | stuff & foo')).toBe(false);
  expect(countFilter({ stuff: 1, foo: 1 }, 'bar | stuff & foo')).toBe(true);
  expect(countFilter({ bar: 1 }, 'bar | stuff & foo')).toBe(true);
});
