import React, { Component } from 'react';
import propTypes from 'prop-types';
import Enzyme, { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import EnzymeAdapter from 'enzyme-adapter-react-16';
import Provider from '../Provider.jsx';
import { MODEL_CONTEXT_KEY } from '../constants';

Enzyme.configure({ adapter: new EnzymeAdapter() });

describe('Provider', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error');
  });

  // Mock the console.
  const mockConsole = () => {
    global.console.error.mockImplementation(() => {});
  };

  // Make sure the console is restored after each tests.
  afterEach(() => {
    global.console.error.mockRestore();
  });

  // Child cannot be a stateless function or findRenderedComponentWithType
  // does not work.
  // eslint-disable-next-line react/prefer-stateless-function
  class Child extends Component {
    render() {
      return (
        <div>
          reacolo model name: {this.context[MODEL_CONTEXT_KEY].mockName}
        </div>
      );
    }
  }
  Child.contextTypes = {
    [MODEL_CONTEXT_KEY]: propTypes.object.isRequired,
  };

  const createModel = props => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
    getContext: jest.fn(),
    getStore: jest.fn(),
    mockName: 'mock-model',
    ...props,
  });

  it("should add the store to the child's context", () => {
    const model = createModel();
    const tree = mount(
      <Provider model={model}>
        <Child />
      </Provider>,
    );
    expect(toJSON(tree)).toMatchSnapshot();
  });

  it('should throw if the store is changed', () => {
    // Avoid React's error message being thrown on jest's console.
    mockConsole();

    const model1 = createModel({ mockName: 'mock-model-1' });
    const model2 = createModel({ mockName: 'mock-model-2' });

    const tree = mount(
      <Provider model={model1}>
        <Child />
      </Provider>,
    );

    expect(() => {
      tree.setProps({ model: model2 });
    }).toThrow();

    expect(toJSON(tree)).toMatchSnapshot();
  });
});
