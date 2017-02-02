import React from 'react';
import renderer from 'react-test-renderer';
import Filter from '../Filter';
import Context from '../Context';
import wouldPass from '../filtering/would-pass';

jest.mock('../filtering/would-pass');

beforeEach(() => {
  wouldPass.mockReset();
  wouldPass.mockImplementation(() => false);
});

describe('Filter with non nested Context', () => {
  it('properly calls wouldPass until it returns true', () => {
    wouldPass.mockReturnValueOnce(false)
             .mockReturnValueOnce(true);
    renderer.create(
      <Filter context={{ contextProp: 'bar' }}>
        <Context prop1="val1" default><div>child1</div></Context>
        <Context prop2="val2"><div>child2</div></Context>
        <Context prop3="val3"><div>child3</div></Context>
      </Filter>
    );
    expect(wouldPass.mock.calls).toEqual([
      [
        { contextProp: 'bar' },
        { prop1: 'val1' }
      ], [
        { contextProp: 'bar' },
        { prop2: 'val2' }
      ]
    ]);
  });
  it('renders the first context that passes', () => {
    wouldPass.mockImplementation((_, { pass }) => pass);
    const component = renderer.create(
      <Filter context={{ roles: {} }}>
        <Context><div>Not to be rendered</div></Context>
        <Context pass><div>To be rendered</div></Context>
        <Context pass><div>Not to be rendered</div></Context>
      </Filter>
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
  it('does not render if no contexts would pass and there is no default context', () => {
    wouldPass.mockReturnValue(false);
    const component = renderer.create(
      <Filter context={{ roles: {} }}>
        <Context><div>Not to be rendered</div></Context>
        <Context><div>Not to be rendered</div></Context>
      </Filter>
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
  it('renders the default context if no contexts would pass', () => {
    wouldPass.mockReturnValue(false);
    const component = renderer.create(
      <Filter context={{ roles: {} }}>
        <Context><div>Not to be rendered</div></Context>
        <Context default><div>Default Filter Content</div></Context>
        <Context><div>Not to be rendered</div></Context>
      </Filter>
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
  it('renders the context that passes even if there is a default context', () => {
    wouldPass.mockImplementation((_, { pass }) => pass);
    const component = renderer.create(
      <Filter context={{ roles: {} }}>
        <Context><div>Not to be rendered</div></Context>
        <Context pass><div>To be rendered</div></Context>
        <Context default><div>Default Filter Content</div></Context>
        <Context pass><div>Not to be rendered</div></Context>
        <Context><div>Not to be rendered</div></Context>
      </Filter>
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
  it('renders the context that passes even if it comes after the default context', () => {
    wouldPass.mockImplementation((_, { pass }) => pass);
    const component = renderer.create(
      <Filter context={{ roles: {} }}>
        <Context><div>Not to be rendered</div></Context>
        <Context default><div>Default Filter Content</div></Context>
        <Context pass><div>To be rendered</div></Context>
        <Context pass><div>Not to be rendered</div></Context>
      </Filter>
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
});

describe('Filter with nested Context components', () => {
  let component;
  beforeEach(() => {
    wouldPass.mockImplementation((_, { pass }) => pass);
    component = renderer.create(
      <Filter context={{ contextProp: 'foo' }}>
        <Context prop1="val1" default>
          <Context prop11="val11"><div>child11</div></Context>
          <Context prop12="val12" pass><div>child12</div></Context>
        </Context>
        <Context prop2="val2" pass>
          <Context prop21="val21"><div>child21</div></Context>
          <Context prop22="val22" pass>
            <Context prop221="val221"><div>child221</div></Context>
            <Context prop222="val222" default><div>child222 (to be rendered)</div></Context>
            <Context prop223="val223"><div>child223</div></Context>
          </Context>
          <Context prop23="val23" pass><div>child23</div></Context>
        </Context>
        <Context prop3="val3"><div>child3</div></Context>
      </Filter>
    );
  });
  it('properly calls wouldPass on nested contexts if their parent passed', () => {
    expect(wouldPass.mock.calls).toEqual([
      [
        { contextProp: 'foo' },
        { prop1: 'val1' }
      ], [
        { contextProp: 'foo' },
        { prop2: 'val2', pass: true }
      ], [
        { contextProp: 'foo' },
        { prop21: 'val21' }
      ], [
        { contextProp: 'foo' },
        { prop22: 'val22', pass: true }
      ], [
        { contextProp: 'foo' },
        { prop221: 'val221' }
      ], [
        { contextProp: 'foo' },
        { prop222: 'val222' }
      ], [
        { contextProp: 'foo' },
        { prop223: 'val223' }
      ]
    ]);
  });
  it('properly renders the right nested context', () => {
    expect(component.toJSON()).toMatchSnapshot();
  });
});
