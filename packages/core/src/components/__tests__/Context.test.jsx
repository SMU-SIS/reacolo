import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import toJSON from 'enzyme-to-json';
import EnzymeAdapter from 'enzyme-adapter-react-16';
import { Context } from '../Context.jsx';
import matchContext from '../../filtering/match-context.js';

jest.mock('../../filtering/match-context.js');

Enzyme.configure({ adapter: new EnzymeAdapter() });

describe('Context', () => {
  beforeEach(() => {
    matchContext.mockReset();
    matchContext.mockImplementation(() => false);
  });

  it('properly calls `matchContext` with the context and the properties to match', () => {
    shallow(
      <Context
        prop1="ignore me"
        matchTest="test value"
        match={{ a: 'a value', b: { bProp: 'value' } }}
        prop2="ignore me again"
        matchOtherTest={{ other: 'test' }}
        render={() => <div />}
        value={{ contextProp: 'val' }}
      />,
    );
    expect(matchContext.mock.calls).toEqual([
      [
        { contextProp: 'val' },
        {
          test: 'test value',
          a: 'a value',
          b: { bProp: 'value' },
          otherTest: { other: 'test' },
        },
      ],
    ]);
  });

  it('does not render if `matchContext returns false`', () => {
    const wrapper = shallow(
      <Context
        render={() => <div>test</div>}
        matchProp="val"
        value={{ contextProp: 'val' }}
      />,
    );
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it('renders using its component property if `matchContext` returns true and it has no render function', () => {
    const Child = () => <div>test</div>;
    matchContext.mockImplementation(() => true);
    const wrapper = shallow(
      <Context
        component={Child}
        matchProp="val"
        value={{ contextProp: 'val' }}
      />,
    );
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it('renders using its render function if it is provided and if `matchContext` returns true', () => {
    matchContext.mockImplementation(() => true);
    const wrapper = shallow(
      <Context
        render={() => <div>test</div>}
        matchProp="val"
        value={{ contextProp: 'val' }}
      />,
    );
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it('throws if there is neither a render function nor a component property regardless of `matchContext` results', () => {
    matchContext.mockImplementation(() => true);
    expect(() => {
      shallow(<Context matchProp="val" value={{ contextProp: 'val' }} />);
    }).toThrow();
  });
});
