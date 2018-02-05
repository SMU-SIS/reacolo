import React, { Component } from 'react';
import shallowEqual from 'shallow-equal/objects';
import { modelPropType, getDisplayName } from '../utils';
import { MODEL_CONTEXT_KEY, MODEL_UPDATE_EVENT } from '../constants';
import ModelSubscription from './model-subscription';

/**
 * Default map model to props used by connect.
 * @param {object} model - The model.
 * @return {{patchStore, setStore, mergeStore}} the properties to inject.
 */
const defaultMapModelToProps = model => ({
  patchStore: model.patchStore
    ? (...args) => model.patchStore(...args)
    : undefined,
  setStore: model.setStore ? (...args) => model.setStore(...args) : undefined,
  mergeStore: model.mergeStore
    ? (...args) => model.mergeStore(...args)
    : undefined,
});

/**
 * Connect a component to the model. Requires the component to be under
 * a <Provider>.
 * @param {func} mapStoreToProps - Map the store to component properties. Called
 * on each model updates.
 * @param {func} mapModelToProps - Map the model to component properties. Used
 * to extract store setters. Called only once per components.
 * @param {func} mapContextToProps - Map the (reacolo) context to component
 * properties.
 * @return {Component} The new connected component.
 */
const connect = (
  mapStoreToProps = null,
  mapModelToProps = defaultMapModelToProps,
  mapContextToProps = null,
) => WrappedComponent => {
  const safeMapStoreToProps = mapStoreToProps
    ? store => mapStoreToProps(store || {})
    : () => null;
  const safeMapContextToProps = mapContextToProps
    ? context => mapContextToProps(context || {})
    : () => null;

  class Connected extends Component {
    constructor(props, context) {
      super(props, context);
      this.model = context[MODEL_CONTEXT_KEY];

      // Handle subscription updates.
      const updateFromModel = val => {
        const storeProps = safeMapStoreToProps(val.store);
        const contextProps = safeMapContextToProps(val.context);
        // Only updates if mapped props have changed.
        if (
          !shallowEqual(storeProps, this.state.storeProps) ||
          !shallowEqual(contextProps, this.state.contextProps)
        ) {
          this.setState({ storeProps, contextProps });
        }
      };

      // Create the subscription
      this.subscription = ModelSubscription(
        this.model,
        updateFromModel,
        MODEL_UPDATE_EVENT,
      );
      this.state = {
        storeProps: safeMapStoreToProps(this.model.getStore()),
        contextProps: safeMapContextToProps(this.model.getContext()),
      };
      // Map the model to properties once and for all (because this typically
      // creates new functions and can be expensive, it is best to avoid
      // calling it on each render).
      this.modelProps = mapModelToProps ? mapModelToProps(this.model) : null;
    }

    componentWillMount() {
      if (mapStoreToProps || mapContextToProps) {
        this.subscription.subscribe();
      }
    }

    componentWillReceiveProps() {
      // Make sure we have the last store & context version. This update
      // may come from a model update from ancestor, meaning that this component
      // may be outdated even though the subscription did not kicked in yet.
      this.setState({
        storeProps: safeMapStoreToProps(this.model.getStore()),
        contextProps: safeMapContextToProps(this.model.getContext()),
      });
    }

    componentWillUnmount() {
      // No need to check if previously subscribed, this does nothing if not
      // subscribed.
      this.subscription.unsubscribe();
    }

    render() {
      return (
        <WrappedComponent
          {...this.state.storeProps}
          {...this.modelProps}
          {...this.state.contextProps}
          {...this.props}
        />
      );
    }
  }

  Connected.displayName = `Connect(${getDisplayName(WrappedComponent)})`;

  Connected.contextTypes = {
    // eslint-disable-next-line react/no-typos
    [MODEL_CONTEXT_KEY]: modelPropType.isRequired,
  };

  return Connected;
};

export default connect;
