/* eslint "react/no-array-index-key": 0 */

import React from 'react';
import renderer from 'react-test-renderer';
import omit from 'object.omit';
import ContextSwitch from '../ContextSwitch.jsx';
import wouldPass from '../../filtering/would-pass.js';

jest.mock('../../filtering/would-pass.js');

describe('ContextSwitch with non nested Context', () => {
  let createMockContext;

  beforeEach(() => {
    wouldPass.mockReset();
    wouldPass.mockImplementation(() => false);
    createMockContext = jest.fn((targets = {}, isDefault = false) => {
      const Context = jest.fn();
      Context.getTargets = jest.fn(() => targets);
      Context.isDefault = jest.fn(() => isDefault);
      Context.isContext = true;
      return Context;
    });
  });

  it('properly calls wouldPass until it returns true', () => {
    wouldPass.mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderer.create(
      <ContextSwitch context={{ contextProp: 'bar' }}>
        {[
          createMockContext({ prop1: 'val1' }),
          createMockContext({ prop2: 'val2' }),
          createMockContext({ prop3: 'val3' }),
        ].map((Context, i) => <Context key={i} />)}
      </ContextSwitch>,
    );
    expect(wouldPass.mock.calls).toEqual([
      [{ contextProp: 'bar' }, { prop1: 'val1' }],
      [{ contextProp: 'bar' }, { prop2: 'val2' }],
    ]);
  });

  it('renders the first context that passes', () => {
    wouldPass.mockImplementation((_, { pass }) => pass);
    const Context = createMockContext();
    const PassingContext = createMockContext({ pass: true });
    const component = renderer.create(
      <ContextSwitch context={{ roles: {} }}>
        <Context>
          <div>Not to be rendered</div>
        </Context>
        <PassingContext>
          <div>To be rendered</div>
        </PassingContext>
        <PassingContext>
          <div>Not to be rendered</div>
        </PassingContext>
      </ContextSwitch>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('does not render if no contexts would pass and there is no default context', () => {
    wouldPass.mockReturnValue(false);
    const Context = createMockContext();
    const component = renderer.create(
      <ContextSwitch context={{ roles: {} }}>
        <Context>
          <div>Not to be rendered</div>
        </Context>
        <Context>
          <div>Not to be rendered</div>
        </Context>
      </ContextSwitch>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders the default context if no contexts would pass', () => {
    wouldPass.mockReturnValue(false);
    const Context = createMockContext();
    const DefaultContext = createMockContext(undefined, true);

    const component = renderer.create(
      <ContextSwitch context={{ roles: {} }}>
        <Context>
          <div>Not to be rendered</div>
        </Context>
        <DefaultContext>
          <div>Default ContextSwitch Content</div>
        </DefaultContext>
        <Context>
          <div>Not to be rendered</div>
        </Context>
      </ContextSwitch>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders the context that passes even if there is a default context', () => {
    wouldPass.mockImplementation((_, { pass }) => pass);
    const Context = createMockContext();
    const DefaultContext = createMockContext(undefined, true);
    const PassingContext = createMockContext({ pass: true });
    const component = renderer.create(
      <ContextSwitch context={{ roles: {} }}>
        <Context>
          <div>Not to be rendered</div>
        </Context>
        <PassingContext>
          <div>To be rendered</div>
        </PassingContext>
        <DefaultContext>
          <div>Default ContextSwitch Content</div>
        </DefaultContext>
        <PassingContext>
          <div>Not to be rendered</div>
        </PassingContext>
        <Context>
          <div>Not to be rendered</div>
        </Context>
      </ContextSwitch>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders the context that passes even if it comes after the default context', () => {
    wouldPass.mockImplementation((_, { pass }) => pass);
    const Context = createMockContext();
    const DefaultContext = createMockContext(undefined, true);
    const PassingContext = createMockContext({ pass: true });
    const component = renderer.create(
      <ContextSwitch context={{ roles: {} }}>
        <Context>
          <div>Not to be rendered</div>
        </Context>
        <DefaultContext>
          <div>Default ContextSwitch Content</div>
        </DefaultContext>
        <PassingContext>
          <div>To be rendered</div>
        </PassingContext>
        <PassingContext>
          <div>Not to be rendered</div>
        </PassingContext>
      </ContextSwitch>,
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
});

describe('ContextSwitch with nested Context components', () => {
  let component;

  beforeEach(() => {
    wouldPass.mockReset();
    wouldPass.mockImplementation((_, { pass }) => pass);
    const Context = jest.fn();
    Context.getTargets = instance =>
      omit(instance.props, ['children', 'default']);
    Context.isDefault = instance => !!instance.props.default;
    Context.isContext = true;
    component = renderer.create(
      <ContextSwitch context={{ contextProp: 'foo' }}>
        <Context prop1="val1" default>
          <Context prop11="val11">
            <div>child11</div>
          </Context>
          <Context prop12="val12" pass>
            <div>child12</div>
          </Context>
        </Context>
        <Context prop2="val2" pass>
          <Context prop21="val21">
            <div>child21</div>
          </Context>
          <Context prop22="val22" pass>
            <Context prop221="val221">
              <div>child221</div>
            </Context>
            <Context prop222="val222" default>
              <div>child222 (to be rendered)</div>
            </Context>
            <Context prop223="val223">
              <div>child223</div>
            </Context>
          </Context>
          <Context prop23="val23" pass>
            <div>child23</div>
          </Context>
        </Context>
        <Context prop3="val3">
          <div>child3</div>
        </Context>
      </ContextSwitch>,
    );
  });

  it('properly calls wouldPass on nested contexts if their parent passed', () => {
    expect(wouldPass.mock.calls).toEqual([
      [{ contextProp: 'foo' }, { prop1: 'val1' }],
      [{ contextProp: 'foo' }, { prop2: 'val2', pass: true }],
      [{ contextProp: 'foo' }, { prop21: 'val21' }],
      [{ contextProp: 'foo' }, { prop22: 'val22', pass: true }],
      [{ contextProp: 'foo' }, { prop221: 'val221' }],
      [{ contextProp: 'foo' }, { prop222: 'val222' }],
      [{ contextProp: 'foo' }, { prop223: 'val223' }],
    ]);
  });

  it('properly renders the right nested context', () => {
    expect(component.toJSON()).toMatchSnapshot();
  });
});
