import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';
import propTypes from 'prop-types';
import Provider from '../Provider.jsx';
import { MODEL_CONTEXT_KEY } from '../../constants';

describe('Provider', () => {
  // Mock the console.
  const mockConsole = () => {
    global.console = {
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };
  };
  // Make sure the console is restored after each tests.
  const globalConsole = global.console;
  afterEach(() => {
    global.console = globalConsole;
  });

  // Child cannot be a stateless function or findRenderedComponentWithType
  // does not work.
  // eslint-disable-next-line react/prefer-stateless-function
  class Child extends Component {
    render() {
      return <div />;
    }
  }
  Child.contextTypes = {
    [MODEL_CONTEXT_KEY]: propTypes.object.isRequired,
  };

  const createModel = props =>
    Object.assign(
      {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        getContext: jest.fn(),
        getStore: jest.fn(),
      },
      props,
    );

  it("should add the store to the child's context", () => {
    const model = createModel();
    const tree = TestUtils.renderIntoDocument(
      <Provider model={model}>
        <Child />
      </Provider>,
    );
    const child = TestUtils.findRenderedComponentWithType(tree, Child);
    expect(child.context[MODEL_CONTEXT_KEY]).toBe(model);
  });

  it('should throw once when receiving a new store in props', () => {
    // Avoid React's error message being thrown on jest's console.
    mockConsole();

    const model1 = createModel();
    const model2 = createModel();

    const tree = TestUtils.renderIntoDocument(
      <Provider model={model1}>
        <Child />
      </Provider>,
    );

    const child = TestUtils.findRenderedComponentWithType(tree, Child);

    expect(() => {
      tree.setProps({ model: model2 });
    }).toThrow();

    expect(child.context[MODEL_CONTEXT_KEY]).toBe(model1);
  });
});
