import targetParser from '../../filtering/target-grammar.pegjs';

const parseTargets = (...args) => targetParser.parse(...args);

describe('The target grammar', () => {
  it('properly decodes simple values', () => {
    expect(parseTargets('foo')).toEqual([[
      { name: 'foo', optional: false }
    ]]);
    expect(parseTargets('a & b')).toEqual([[
      { name: 'a', optional: false },
      { name: 'b', optional: false }
    ]]);
    expect(parseTargets('abc & def & ghi')).toEqual([[
      { name: 'abc', optional: false },
      { name: 'def', optional: false },
      { name: 'ghi', optional: false }
    ]]);
  });
  it('properly decodes optional values', () => {
    expect(parseTargets('foo?')).toEqual([[
      { name: 'foo', optional: true }
    ]]);
    expect(parseTargets('a? & b')).toEqual([[
      { name: 'a', optional: true },
      { name: 'b', optional: false }
    ]]);
    expect(parseTargets('abc? & def? & ghi')).toEqual([[
      { name: 'abc', optional: true },
      { name: 'def', optional: true },
      { name: 'ghi', optional: false }
    ]]);
  });
  it('properly decodes the wildcase', () => {
    expect(parseTargets('*')).toEqual([[
      { name: '*', optional: false }
    ]]);
    expect(parseTargets('*?')).toEqual([[
      { name: '*', optional: true }
    ]]);
    expect(parseTargets('* & foo & bar')).toEqual([[
      { name: '*', optional: false },
      { name: 'foo', optional: false },
      { name: 'bar', optional: false }
    ]]);
    expect(parseTargets('*? & foo & bar?')).toEqual([[
      { name: '*', optional: true },
      { name: 'foo', optional: false },
      { name: 'bar', optional: true }
    ]]);
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
      parseTargets('aa & ( cc & bb )')
    ).toEqual(
      parseTargets('aa & cc & bb')
    );
    expect(
      parseTargets('aa & ( cc | bb )')
    ).toEqual(
      parseTargets('aa & cc | aa & bb')
    );
    expect(
      parseTargets('a & ( b | c? ) | ( d & ( c | e & * ))')
    ).toEqual(
      parseTargets('a & b | a & c? | d & c | d & e & *')
    );
  });
  it('supports omission of the \'and\' operator', () => {
    expect(
      parseTargets('aa bb cc')
    ).toEqual(
      parseTargets('aa & bb & cc')
    );
    expect(
      parseTargets('a b c | d e *')
    ).toEqual(
      parseTargets('a & b & c | d & e & *')
    );
    expect(
      parseTargets('a? ( o1 | o2 ) * b')
    ).toEqual(
      parseTargets('a? & o1 & * & b | a? & o2 & * & b')
    );
  });
});
