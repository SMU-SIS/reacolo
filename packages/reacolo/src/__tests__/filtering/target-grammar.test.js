import targetParser from '../../filtering/target-grammar.pegjs';

const wildcase = '.';

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
    expect(parseTargets(wildcase)).toEqual([[
      { name: wildcase, optional: false }
    ]]);
    expect(parseTargets(`${wildcase}?`)).toEqual([[
      { name: wildcase, optional: true }
    ]]);
    expect(parseTargets(`${wildcase} & foo & bar`)).toEqual([[
      { name: wildcase, optional: false },
      { name: 'foo', optional: false },
      { name: 'bar', optional: false }
    ]]);
    expect(parseTargets(`${wildcase}? & foo & bar?`)).toEqual([[
      { name: wildcase, optional: true },
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
      parseTargets(`abc   & ${wildcase}  &  def `)
    ).toEqual(
      parseTargets(`abc&${wildcase}&def`)
    );
    expect(
      parseTargets(`abc?   & ${wildcase}?  &  def `)
    ).toEqual(
      parseTargets(`abc?&${wildcase}?&def`)
    );
  });
  it('supports multiple groups of targets (or operator)', () => {
    const groups = parseTargets(`a & b | bc? | ${wildcase} & foo & bar?`);
    expect(groups).toEqual([].concat(
      parseTargets('a & b'),
      parseTargets(' bc?'),
      parseTargets(`${wildcase} & foo & bar?`)
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
      parseTargets(`a & ( b | c? ) | ( d & ( c | e & ${wildcase} ))`)
    ).toEqual(
      parseTargets(`a & b | a & c? | d & c | d & e & ${wildcase}`)
    );
  });
  it('supports omission of the \'and\' operator', () => {
    expect(
      parseTargets('aa bb cc')
    ).toEqual(
      parseTargets('aa & bb & cc')
    );
    expect(
      parseTargets(`a b c | d e ${wildcase}`)
    ).toEqual(
      parseTargets(`a & b & c | d & e & ${wildcase}`)
    );
    expect(
      parseTargets(`a? ( o1 | o2 ) ${wildcase} b`)
    ).toEqual(
      parseTargets(`a? & o1 & ${wildcase} & b | a? & o2 & ${wildcase} & b`)
    );
  });
  it('supports names with special characters and numbers', () => {
    expect(
      parseTargets('a@3#4- _$1+%? 3? _')
    ).toEqual([[
      { name: 'a@3#4-', optional: false },
      { name: '_$1+%', optional: true },
      { name: '3', optional: true },
      { name: '_', optional: false }
    ]]);
  });
});
