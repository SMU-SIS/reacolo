import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import EnzymeAdapter from 'enzyme-adapter-react-16';
import toJSON from 'enzyme-to-json';
import matchContext from '@reacolo/match';
import { Context } from '../Context.jsx';
import createMatcher from '../create-matcher.js';

jest.mock('../create-matcher.js');
jest.mock('@reacolo/match');

Enzyme.configure({ adapter: new EnzymeAdapter() });

describe('Context', () => {
  beforeEach(() => {
    matchContext.mockReset();
    matchContext.mockImplementation(() => false);
    createMatcher.mockReset();
    createMatcher.mockImplementation(() => ({}));
  });

  it('properly calls `createMatcher` with its props', () => {
    const props = {
      prop1: 'val1',
      prop2: 'val2',
      prop3: 'val3',
      render: () => <div />,
      contextValue: { contextProp: 'val' },
    };
    shallow(<Context {...props} />);
    expect(createMatcher.mock.calls).toEqual([
      [Object.assign({}, Context.defaultProps, props)],
    ]);
  });

  it('properly calls `matchContext` with the context and the matcher', () => {
    createMatcher.mockImplementation(() => ({ matcherProp: 'valToMatch' }));
    shallow(
      <Context render={() => <div />} contextValue={{ contextProp: 'val' }} />,
    );
    expect(matchContext.mock.calls).toEqual([
      [{ contextProp: 'val' }, { matcherProp: 'valToMatch' }],
    ]);
  });

  it('does not render if `matchContext returns false`', () => {
    const wrapper = shallow(
      <Context
        render={() => <div>test</div>}
        matchProp="val"
        contextValue={{ contextProp: 'val' }}
      />,
    );
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it('renders its children if there is any, `matchContext` returns true and there is no render function nor component property', () => {
    matchContext.mockImplementation(() => true);
    const wrapper = shallow(
      <Context matchProp="val" contextValue={{ contextProp: 'val' }}>
        <div>render that</div>
      </Context>,
    );
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it('renders using its component property if `matchContext` returns true and it has no render function', () => {
    matchContext.mockImplementation(() => true);
    const wrapper = shallow(
      <Context
        component={() => <div>render that</div>}
        matchProp="val"
        contextValue={{ contextProp: 'val' }}
      >
        <div>do not render that</div>
      </Context>,
    );
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it('renders using its render function if it is provided and if `matchContext` returns true', () => {
    matchContext.mockImplementation(() => true);
    const wrapper = shallow(
      <Context
        render={() => <div>render that</div>}
        component={() => <div>do not render that</div>}
        matchProp="val"
        contextValue={{ contextProp: 'val' }}
      >
        <div>do not render that</div>
      </Context>,
    );
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it('throws if there is no render function, no component property and no children', () => {
    matchContext.mockImplementation(() => true);
    expect(() => {
      shallow(
        <Context matchProp="val" contextValue={{ contextProp: 'val' }} />,
      );
    }).toThrow();
  });

  it('renders in accordance with the computedMatchResult prop if it is provided', () => {
    const notMatchedTree = shallow(
      <Context
        contextValue={{ contextProp: 'val' }}
        computedMatch={{ matched: false }}
        render={() => <div />}
      />,
    );
    const matchedTree = shallow(
      <Context
        contextValue={{ contextProp: 'val' }}
        computedMatch={{ matched: true }}
        render={() => <div />}
      />,
    );

    expect(toJSON(notMatchedTree)).toMatchSnapshot();
    expect(toJSON(matchedTree)).toMatchSnapshot();

    // These are not supposed to be called when computedMatchResult is provided.
    expect(createMatcher.mock.calls.length).toBe(0);
    expect(matchContext.mock.calls.length).toBe(0);
  });
});
