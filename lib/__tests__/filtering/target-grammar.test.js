import targetParser from '../../reacolo/filtering/target-grammar.pegjs';

const parseTargets = (...args) => targetParser.parse(...args);

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
});

describe('parseTargets', () => {
  it('calls parseTargets on each group', () => {
    const groups = parseTargets('a & b | bc? | * & foo & bar?');
    expect(groups).toEqual([].concat(
      parseTargets('a & b'),
      parseTargets(' bc?'),
      parseTargets('* & foo & bar?')
    ));
  });
});
