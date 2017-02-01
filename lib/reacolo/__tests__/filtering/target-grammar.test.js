import targetParser from '../../filtering/target-grammar.pegjs';

const parseTargets = (...args) => targetParser.parse(...args);

const targetCompare = (ts1, ts2) => {
  const ts1Keys = Object.keys(ts1).sort();
  const ts2Keys = Object.keys(ts2).sort();
  if (ts1Keys > ts2Keys) return 1;
  return ts1Keys > ts2Keys ? -1 : 0;
};

describe('The target grammar', () => {
  it('properly decodes simple values', () => {
    expect(parseTargets('foo')).toEqual([{
      foo: { optional: false }
    }]);
    expect(parseTargets('a & b')).toEqual([{
      a: { optional: false },
      b: { optional: false }
    }]);
    expect(parseTargets('abc & def & ghi')).toEqual([{
      abc: { optional: false },
      def: { optional: false },
      ghi: { optional: false }
    }]);
  });
  it('properly decodes optional values', () => {
    expect(parseTargets('foo?')).toEqual([{
      foo: { optional: true }
    }]);
    expect(parseTargets('a? & b')).toEqual([{
      a: { optional: true },
      b: { optional: false }
    }]);
    expect(parseTargets('abc? & def? & ghi')).toEqual([{
      abc: { optional: true },
      def: { optional: true },
      ghi: { optional: false }
    }]);
  });
  it('properly decodes the wildcase', () => {
    expect(parseTargets('*')).toEqual([{
      '*': { optional: false }
    }]);
    expect(parseTargets('*?')).toEqual([{
      '*': { optional: true }
    }]);
    expect(parseTargets('*&foo&bar')).toEqual([{
      '*': { optional: false },
      foo: { optional: false },
      bar: { optional: false }
    }]);
    expect(parseTargets('*?&foo&bar?')).toEqual([{
      '*': { optional: true },
      bar: { optional: true },
      foo: { optional: false }
    }]);
  });
  it('it trims target names', () => {
    expect(
      parseTargets('  abc   & bcd   &    def ')
    ).toEqual(
      parseTargets('abc&bcd&def')
    );
    expect(
      parseTargets('abc   & *  &  def ')
    ).toEqual(
      parseTargets('abc&*&def')
    );
    expect(
      parseTargets('abc?   & *?  &  def ')
    ).toEqual(
      parseTargets('abc?&*?&def')
    );
  });
  it('supports multiple groups of targets (or operator)', () => {
    const groups = parseTargets('a & b | bc? | * & foo & bar?');
    expect(groups).toEqual([].concat(
      parseTargets('a & b'),
      parseTargets(' bc?'),
      parseTargets('* & foo & bar?')
    ));
  });
  it('supports parentheses', () => {
    expect(
      parseTargets('abc & ( c & b )')
    ).toEqual(
      parseTargets('abc & c & b')
    );
    expect(
      parseTargets('abc & ( c | b )').sort(targetCompare)
    ).toEqual(
      parseTargets('abc & b | abc & c').sort(targetCompare)
    );
    expect(
      parseTargets('c & ( u | i? ) | ( a & i )').sort(targetCompare)
    ).toEqual(
      parseTargets('c & u | i? & c | a & i').sort(targetCompare)
    );
  });
});
