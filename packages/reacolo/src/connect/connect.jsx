import React, { Component } from 'react';
import { modelPropType } from '../utils/prop-types';
import { MODEL_CONTEXT_KEY, MODEL_UPDATE_EVENT } from '../constants';
import ModelSubscription from './model-subscription';

// Return the display name of a component.
const getDisplayName = WrappedComponent =>
  WrappedComponent.displayName || WrappedComponent.name || 'Component';

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

const connect = (
  mapStoreToProps = undefined,
  mapModelToProps = defaultMapModelToProps,
) => WrappedComponent => {
  class Connected extends Component {
    constructor(props, context) {
      super(props, context);
      const model = context[MODEL_CONTEXT_KEY];
      this.subscription = ModelSubscription(
        model,
        ({ store }) => this.setState({ store }),
        MODEL_UPDATE_EVENT,
      );
      this.state = { store: model.getStore() };
      this.modelProps = mapModelToProps(model);
    }

    componentWillMount() {
      if (mapStoreToProps) {
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
          {...(mapStoreToProps ? mapStoreToProps(this.state.store) : null)}
          {...this.modelProps}
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
