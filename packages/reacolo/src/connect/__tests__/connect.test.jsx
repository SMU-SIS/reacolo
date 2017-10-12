import React, { Component } from 'react';
import Enzyme, { shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import toJson from 'enzyme-to-json';
import TestUtils from 'react-dom/test-utils';
import propTypes from 'prop-types';
import connect from '../connect';
import { MODEL_CONTEXT_KEY, MODEL_UPDATE_EVENT } from '../../constants';
import Provider from '../../components/Provider';

Enzyme.configure({ adapter: new Adapter() });

describe('connect', () => {
  // Helper to create a mock model.
  const createMockModel = (props = {}) =>
    Object.assign(
      {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        getStore: jest.fn(),
        getContext: jest.fn(),
        setStore: jest.fn(),
        mergeStore: jest.fn(),
        patchStore: jest.fn(),
      },
      props,
    );

  it('properly renders its child', () => {
    const model = createMockModel();

    // Render the test tree.
    const Child = () => <div>test</div>;
    const ConnectedChild = connect()(Child);
    const wrapper = mount(
      <ConnectedChild prop1="prop1-value" prop2="prop2-value" />,
      {
        context: { [MODEL_CONTEXT_KEY]: model },
      },
    );

    // Make sure the child has been properly rendered
    const childrenWrapper = wrapper.find(Child);
    expect(childrenWrapper.length).toBe(1);
    expect(childrenWrapper.props()).toMatchObject({
      prop1: 'prop1-value',
      prop2: 'prop2-value',
    });
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should pass the model setters to the connected component', () => {
    // Init mock model.
    const setStoreResult = Symbol('set store');
    const mergeStoreResult = Symbol('merge store');
    const patchStoreResult = Symbol('patch store');
    const model = createMockModel({
      setStore: jest.fn(() => setStoreResult),
      mergeStore: jest.fn(() => mergeStoreResult),
      patchStore: jest.fn(() => patchStoreResult),
    });

    // Render the test tree.
    const ConnectedChild = connect()(() => <div />);
    const wrapper = shallow(<ConnectedChild />, {
      context: { [MODEL_CONTEXT_KEY]: model },
    });

    const childrenProps = wrapper.props();
    // Test the presence and type of the received properties.
    expect(typeof childrenProps.setStore).toBe('function');
    expect(typeof childrenProps.mergeStore).toBe('function');
    expect(typeof childrenProps.patchStore).toBe('function');
    // Make sure they do proxy the original model setters.
    expect(childrenProps.setStore('test set', 0)).toBe(setStoreResult);
    expect(childrenProps.mergeStore('test merge', 1)).toBe(mergeStoreResult);
    expect(childrenProps.patchStore('test patch', 2)).toBe(patchStoreResult);
    expect(model.setStore.mock.calls).toEqual([['test set', 0]]);
    expect(model.mergeStore.mock.calls).toEqual([['test merge', 1]]);
    expect(model.patchStore.mock.calls).toEqual([['test patch', 2]]);
  });

  it('only passes the existing model setters to the connected component', () => {
    // Init the mock model.
    const model = {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      getStore: jest.fn(),
      getContext: jest.fn(),
    };

    // Render the test tree.
    const ConnectedChild = connect()(() => <div />);
    const wrapper = shallow(<ConnectedChild />, {
      context: { [MODEL_CONTEXT_KEY]: model },
    });

    // Test if the model setters has been provided.
    expect(wrapper.props()).toEqual({});
  });

  it('does not subscribe to the model if there is not `mapStoreToProps` or `mapContextToProps` argument', () => {
    // Init the mock model.
    const model = createMockModel();

    // Create the components and render the tree.
    const ConnectedChild = connect()(() => <div />);
    shallow(<ConnectedChild />, {
      context: { [MODEL_CONTEXT_KEY]: model },
    });

    // Test!
    expect(model.addListener.mock.calls.length).toBe(0);
    expect(model.addListener.mock.calls.length).toBe(0);
  });

  it('uses `mapStoreToProps` to extract store properties', () => {
    // Init the mock model.
    const model = createMockModel({
      getStore: jest.fn(() => ({ a: { b: 'test2' }, c: 'test1' })),
    });

    // The store mapper.
    const mapStoreToProps = store => ({ prop1: store.c, prop2: store.a.b });

    // Create and render.
    const ConnectedChild = connect(mapStoreToProps)(() => <div />);
    const wrapper = shallow(<ConnectedChild />, {
      context: { [MODEL_CONTEXT_KEY]: model },
    });

    // Test!
    expect(wrapper.props()).toMatchObject({
      prop1: 'test1',
      prop2: 'test2',
    });
  });

  it('uses `mapModelToProps` to extract setters', () => {
    // Init the mock model.
    const mockModel = createMockModel();

    // The model mapper.
    const mapModelToProps = model => ({
      setProp: x => model.mergeStore({ x }),
    });

    // Create and render.
    const ConnectedChild = connect(null, mapModelToProps)(() => <div />);
    const wrapper = shallow(<ConnectedChild />, {
      context: { [MODEL_CONTEXT_KEY]: mockModel },
    });

    // Test!
    expect(typeof wrapper.props().setProp).toBe('function');
    wrapper.props().setProp('test');
    expect(mockModel.mergeStore.mock.calls).toEqual([[{ x: 'test' }]]);
  });

  it('does not provide any model setters if `mapModelToProps` is null', () => {
    // Init the mock model.
    const mockModel = createMockModel();

    // Create and render.
    const ConnectedChild = connect(null, null)(() => <div />);
    const wrapper = shallow(<ConnectedChild />, {
      context: { [MODEL_CONTEXT_KEY]: mockModel },
    });

    // Test!
    expect(wrapper.props()).toEqual({});
  });

  it('subscribes and updates on store updates', () => {
    // Init the mock model.
    const model = createMockModel({
      getStore: jest
        .fn()
        .mockReturnValueOnce({ a: { b: 'test2' }, c: 'test1' }),
    });

    // The store mapper.
    const mapStoreToProps = store => ({ prop1: store.c, prop2: store.a.b });

    // Create the components
    // (must extends component for findRenderedComponentWithType).
    // eslint-disable-next-line react/prefer-stateless-function
    class Child extends Component {
      render() {
        return <div />;
      }
    }
    const ConnectedChild = connect(mapStoreToProps)(Child);
    const Base = () => <ConnectedChild />;

    // Render the tree.
    const tree = TestUtils.renderIntoDocument(
      // Unfortunately we need to rely on Provider here as there is no other way
      // to set the context with TestUtils.
      // It is possible to provide the context with Enzyme, but Enzyme does not
      // update on asynchronous updates
      // (c.f. https://github.com/airbnb/enzyme/issues/450).
      <Provider model={model}>
        <Base />
      </Provider>,
    );
    const child = TestUtils.findRenderedComponentWithType(tree, Child);

    // Check the model listener.
    expect(model.addListener.mock.calls.length).toBe(1);
    expect(model.addListener.mock.calls[0][0]).toBe(MODEL_UPDATE_EVENT);
    expect(typeof model.addListener.mock.calls[0][1]).toBe('function');

    // Call the fetch model listener.
    model.addListener.mock.calls[0][1]({
      store: { a: { b: 'new-value-2' }, c: 'new-value-1' },
    });

    // Test!
    expect(child.props).toMatchObject({
      prop1: 'new-value-1',
      prop2: 'new-value-2',
    });
  });

  it('subscribes and updates on context updates', () => {
    // Init the mock model.
    const model = createMockModel({
      getContext: jest
        .fn()
        .mockReturnValueOnce({ a: { b: 'test2' }, c: 'test1' }),
    });

    // The store mapper.
    const mapContextToProps = store => ({ prop1: store.c, prop2: store.a.b });

    // Create the components
    // (must extends component for findRenderedComponentWithType).
    // eslint-disable-next-line react/prefer-stateless-function
    class Child extends Component {
      render() {
        return <div />;
      }
    }
    const ConnectedChild = connect(undefined, undefined, mapContextToProps)(
      Child,
    );
    const Base = () => <ConnectedChild />;

    // Render the tree.
    const tree = TestUtils.renderIntoDocument(
      // Unfortunately we need to rely on Provider here as there is no other way
      // to set the context with TestUtils.
      // It is possible to provide the context with Enzyme, but Enzyme does not
      // update on asynchronous updates
      // (c.f. https://github.com/airbnb/enzyme/issues/450).
      <Provider model={model}>
        <Base />
      </Provider>,
    );
    const child = TestUtils.findRenderedComponentWithType(tree, Child);

    // Check the model listener.
    expect(model.addListener.mock.calls.length).toBe(1);
    expect(model.addListener.mock.calls[0][0]).toBe(MODEL_UPDATE_EVENT);
    expect(typeof model.addListener.mock.calls[0][1]).toBe('function');

    // Call the fetch model listener.
    model.addListener.mock.calls[0][1]({
      context: { a: { b: 'new-value-2' }, c: 'new-value-1' },
    });

    // Test!
    expect(child.props).toMatchObject({
      prop1: 'new-value-1',
      prop2: 'new-value-2',
    });
  });

  it('unsubscribes to model updates', () => {
    // Create the mock model.
    const model = createMockModel({
      getStore: jest.fn().mockReturnValue({ x: 'x-val' }),
      getContext: jest.fn().mockReturnValue({ y: 'y-val' }),
    });

    // Create test components.
    const A = () => <div />;
    const ConnectedA = connect(
      store => store.x,
      undefined,
      context => context.y,
    )(A);
    const Main = props => (props.empty ? null : <ConnectedA />);

    // Mount the tree.
    const wrapper = mount(<Main empty={false} />, {
      context: { [MODEL_CONTEXT_KEY]: model },
      // Required for enzyme to pass the model if the root is not connected.
      childContextTypes: { [MODEL_CONTEXT_KEY]: propTypes.object },
    });

    // Test!
    expect(model.addListener.mock.calls.length).toBe(1);
    expect(model.removeListener.mock.calls.length).toBe(0);
    wrapper.setProps({ empty: true });
    expect(model.removeListener.mock.calls).toEqual(
      model.addListener.mock.calls,
    );
  });

  it('sets the displayName correctly', () => {
    expect(
      connect()(
        // eslint-disable-next-line react/prefer-stateless-function
        class Foo extends Component {
          render() {
            return <div />;
          }
        },
      ).displayName,
    ).toBe('Connect(Foo)');

    expect(
      connect()(
        // eslint-disable-next-line react/prefer-stateless-function
        class Foo extends Component {
          static get displayName() {
            return 'Bar';
          }
          render() {
            return <div />;
          }
        },
      ).displayName,
    ).toBe('Connect(Bar)');

    expect(
      connect()(
        // eslint-disable-next-line prefer-arrow-callback
        function FooBar() {
          return <div />;
        },
      ).displayName,
    ).toBe('Connect(FooBar)');

    expect(connect()(() => <div />).displayName).toBe('Connect(Component)');
  });

  // TODO: this is still failing: B is rendered twice
  it.skip('Does not update a component more than once on model updates', () => {
    // Store the renders as strings.
    const renders = [];

    // Create the components
    const bDecorator = connect(({ bStuff }) => ({ bStuff }));
    const B = bDecorator(({ aStuff, bStuff }) => {
      renders.push('B');
      return (
        <div>
          {aStuff}
          {bStuff}
        </div>
      );
    });
    const aDecorator = connect(({ aStuffToPassToB }) => ({ aStuffToPassToB }));
    const A = aDecorator(({ aStuffToPassToB }) => {
      renders.push('A');
      return (
        <div>
          <B aStuff={aStuffToPassToB} />
        </div>
      );
    });

    // Create the mock model.
    const model = createMockModel({
      getStore: jest
        .fn()
        .mockReturnValue({ bStuff: 'b1', aStuffToPassToB: 'a1' }),
    });

    // render the tree.
    const wrapper = mount(<A />, {
      context: { [MODEL_CONTEXT_KEY]: model },
    });

    // Look at the first render.
    expect(renders).toEqual(['A', 'B']);
    expect(toJson(wrapper)).toMatchSnapshot();

    // Trigger a model update.
    model.getStore.mockReturnValue({ bStuff: 'b2', aStuffToPassToB: 'a2' });
    model.addListener.mock.calls.forEach(c =>
      c[1]({ store: { bStuff: 'b2', aStuffToPassToB: 'a2' } }),
    );

    // Look at the new render.
    expect(renders).toEqual(['A', 'B', 'A', 'B']);
    expect(toJson(wrapper.update())).toMatchSnapshot();
  });

  it('does not update a child when it needs to be unmounted', () => {
    // Store the renders as strings.
    const renders = [];

    // Create the components.
    const B = connect(store => ({ foo: store.x }))(({ foo }) => {
      renders.push('B');
      return <div>{foo}</div>;
    });
    const A = connect(({ renderB }) => ({ renderB }))(({ renderB }) => {
      renders.push('A');
      return <div>{renderB ? <B /> : ''}</div>;
    });

    // Create the mock model.
    const model = createMockModel({
      getStore: jest.fn().mockReturnValue({ renderB: true, foo: 'bar' }),
    });

    // Render the tree.
    mount(<A />, { context: { [MODEL_CONTEXT_KEY]: model } });

    // Test the initial renders.
    expect(renders).toEqual(['A', 'B']);

    // Update the model.
    const newStore = { renderB: false, foo: 'babar' };
    model.getStore.mockReturnValue(newStore);
    model.addListener.mock.calls.forEach(c => c[1]({ store: newStore }));
    expect(renders).toEqual(['A', 'B', 'A']);
  });

  it.skip('does not render the wrapped component when mapStore does not produce change', () => {
    // Count the number of times the component is rendered.
    let renders = 0;

    // Init the mock model.
    const model = createMockModel({
      getStore: jest.fn().mockReturnValue({ a: 'test1', b: 'test2' }),
    });

    // The store mapper.
    const mapStoreToProps = store => ({ prop: store.a });

    const ConnectedComponent = connect(mapStoreToProps)(() => {
      renders += 1;
      return <div />;
    });

    // Render the tree.
    mount(<ConnectedComponent />, {
      context: { [MODEL_CONTEXT_KEY]: model },
    });

    expect(renders).toBe(1);

    const newStore = { a: 'test1', b: 'test3' };
    model.getStore.mockReturnValue(newStore);
    model.addListener.mock.calls[0][1]({ store: newStore });

    // No update since store.a did not actually changed
    expect(renders).toBe(1);
  });
});
