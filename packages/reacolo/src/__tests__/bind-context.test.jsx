import React from 'react';
import renderer from 'react-test-renderer';
import bindContext from '../bind-context';

describe('bindContext', () => {
  it('creates contextes that cannot be directly rendered', () => {
    const Context = bindContext();
    expect(() => {
      renderer.create(<Context />);
    }).toThrow();
  });
  it('creates contextes that are default in function of the default props', () => {
    const Context = bindContext();
    expect(Context.isDefault(<Context />))
      .toBe(false);
    expect(Context.isDefault(<Context default />))
      .toBe(true);
    expect(Context.isDefault(<Context default={false} />))
      .toBe(false);
  });
  it('creates contexts whose targets are the props minus the default and children by default'
      + ' props', () => {
    const Context = bindContext();
    expect(Context.getTargets(<Context foo="foo" bar="bar" />))
      .toEqual({ foo: 'foo', bar: 'bar' });
    expect(Context.getTargets(<Context foo="foo" bar="bar" default><div /></Context>))
      .toEqual({ foo: 'foo', bar: 'bar' });
  });
  it('properly uses propsToTargets when provided as a function to fetch its targets', () => {
    const targets = {};
    const propsToTargets = jest.fn(() => targets);
    const Context = bindContext(propsToTargets);
    const contextElement = (<Context bar="bar" default><div /></Context>);
    const contextTargets = Context.getTargets(contextElement);
    expect(contextTargets)
      .toBe(targets);
    expect(propsToTargets.mock.calls)
      .toEqual([[{ bar: 'bar' }]]);
  });
  it('properly uses propsToTargets when provided as an object to extends its targets', () => {
    const Context = bindContext({ foo: 'foo' });
    const contextElement = (<Context bar="bar" default><div /></Context>);
    expect(Context.getTargets(contextElement))
      .toEqual({ bar: 'bar', foo: 'foo' });
  });
  it('gives the priority on its own properties rather than propsToTargets', () => {
    const Context = bindContext({ foo: 'foo' });
    const contextElement = (<Context bar="bar" foo="stuff" default><div /></Context>);
    expect(Context.getTargets(contextElement))
      .toEqual({ bar: 'bar', foo: 'stuff' });
  });
});
