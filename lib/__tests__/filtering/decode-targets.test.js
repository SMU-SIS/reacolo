import decodeValueGroups, { wildcase, decodeValueGroup } from '../../reacolo/filtering/decode-targets';

describe('decodeValueGroup', () => {
  it('properly decodes simple values', () => {
    expect(decodeValueGroup('foo')).toEqual({
      foo: { optional: false }
    });
    expect(decodeValueGroup('a & b')).toEqual({
      a: { optional: false },
      b: { optional: false }
    });
    expect(decodeValueGroup('abc & def & ghi')).toEqual({
      abc: { optional: false },
      def: { optional: false },
      ghi: { optional: false }
    });
  });
  it('properly decodes optional values', () => {
    expect(decodeValueGroup('foo?')).toEqual({
      foo: { optional: true }
    });
    expect(decodeValueGroup('a? & b')).toEqual({
      a: { optional: true },
      b: { optional: false }
    });
    expect(decodeValueGroup('abc? & def? & ghi')).toEqual({
      abc: { optional: true },
      def: { optional: true },
      ghi: { optional: false }
    });
  });
  it('properly decodes the wildcase', () => {
    expect(decodeValueGroup('*')).toEqual({
      [wildcase]: { optional: false }
    });
    expect(decodeValueGroup('*?')).toEqual({
      [wildcase]: { optional: true }
    });
    expect(decodeValueGroup('*&foo&bar')).toEqual({
      [wildcase]: { optional: false },
      foo: { optional: false },
      bar: { optional: false }
    });
    expect(decodeValueGroup('*?&foo&bar?')).toEqual({
      [wildcase]: { optional: true },
      bar: { optional: true },
      foo: { optional: false }
    });
  });
  it('it trims target names', () => {
    expect(
      decodeValueGroup('  abc   & bcd   &    def ')
    ).toEqual(
      decodeValueGroup('abc&bcd&def')
    );
    expect(
      decodeValueGroup('abc   & *  &  def ')
    ).toEqual(
      decodeValueGroup('abc&*&def')
    );
    expect(
      decodeValueGroup('abc?   & *?  &  def ')
    ).toEqual(
      decodeValueGroup('abc?&*?&def')
    );
  });
  it('it returns an empty object if the group is undefined', () => {
    expect(decodeValueGroup()).toEqual({});
    expect(decodeValueGroup(null)).toEqual({});
  });
});

describe('decodeValueGroups', () => {
  it('calls decodeValueGroup on each group', () => {
    const groups = decodeValueGroups('a & b | bc? | * & foo & bar?');
    expect(groups).toEqual([
      decodeValueGroup('a & b'),
      decodeValueGroup(' bc?'),
      decodeValueGroup('* & foo & bar?')
    ]);
  });
  it('works when there is only one group', () => {
    const groups = decodeValueGroups('a & b?');
    expect(groups).toEqual([
      decodeValueGroup('a & b?')
    ]);
  });
  it('returns an empty', () => {
    const groups = decodeValueGroups('a & b?');
    expect(groups).toEqual([
      decodeValueGroup('a & b?')
    ]);
  });
  it('returns an array with a single empty group if groups is undefined', () => {
    expect(decodeValueGroups()).toEqual([decodeValueGroup()]);
    expect(decodeValueGroup(null)).toEqual(decodeValueGroup(null));
  });
});
