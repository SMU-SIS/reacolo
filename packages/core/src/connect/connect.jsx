import React, { Component } from 'react';
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
  class Connected extends Component {
    constructor(props, context) {
      super(props, context);
      const model = context[MODEL_CONTEXT_KEY];
      // Create the subscription
      this.subscription = ModelSubscription(
        model,
        val => this.setState({ store: val.store, context: val.context }),
        MODEL_UPDATE_EVENT,
      );
      this.state = { store: model.getStore(), context: model.getContext() };
      // Map the model to properties once and for all (because this typically
      // creates new functions and can be expensive, it is best to avoid
      // calling it on each render).
      this.modelProps = mapModelToProps ? mapModelToProps(model) : null;
    }

    componentWillMount() {
      if (mapStoreToProps || mapContextToProps) {
        this.subscription.subscribe();
      }
    }

    componentWillUnmount() {
      // No need to check if previously subscribed, this does nothing if not
      // subscribed.
      this.subscription.unsubscribe();
    }

    render() {
      return (
        <WrappedComponent
          {...(mapStoreToProps
            ? mapStoreToProps(this.state.store || {})
            : null)}
          {...this.modelProps}
          {...(mapContextToProps
            ? mapContextToProps(this.state.context || {})
            : null)}
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
