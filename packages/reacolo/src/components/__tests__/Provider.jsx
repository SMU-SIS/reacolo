import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';
import propTypes from 'prop-types';
import Provider from '../Provider.js';
import { MODEL_CONTEXT_KEY } from '../../constants';

describe('Provider', () => {
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

  it('should add the store to the child context', () => {
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
    const model1 = createModel();
    const model2 = createModel();
    const componentDidCatch = jest.fn();

    class ProviderContainer extends Component {
      constructor() {
        super();
        this.state = { model: model1 };
        this.componentDidCatch = componentDidCatch;
      }
      render() {
        return (
          <Provider model={this.state.model}>
            <Child />
          </Provider>
        );
      }
    }

    const container = TestUtils.renderIntoDocument(<ProviderContainer />);
    const child = TestUtils.findRenderedComponentWithType(container, Child);
    expect(child.context[MODEL_CONTEXT_KEY]).toEqual(model1);
    expect(componentDidCatch.mock.calls.length).toBe(0);

    container.setState({ model: model2 });

    expect(componentDidCatch.mock.calls.length).toBe(1);
    expect(componentDidCatch.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(componentDidCatch.mock.calls[0][0].message).toBe(
      '<Provider> does not support changing the model.',
    );

    expect(child.context[MODEL_CONTEXT_KEY]).toEqual(model1);
  });
});
