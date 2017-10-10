import React, { Component } from 'react';
import PropTypes from 'prop-types';

const attachModelHandlers = (model, handlers) => {
  handlers.forEach(([evt, handler]) => {
    model.addListener(evt, handler);
  });
};

const detachModelHandlers = (model, handlers) => {
  handlers.forEach(([evt, handler]) => {
    model.removeListener(evt, handler);
  });
};

const getDisplayName = WrappedComponent =>
  WrappedComponent.displayName || WrappedComponent.name || 'Component';

const connect = (WrappedComponent, model) => {
  const setStore = (...args) => model.setStore(...args);
  const patchStore = model.patchStore
    ? (...args) => model.patchStore(...args)
    : undefined;
  const mergeStore = model.mergeStore
    ? (...args) => model.mergeStore(...args)
    : undefined;

  class Connected extends Component {
    constructor(props) {
      super(props);
      this.state = {
        store: model.getStore(),
        context: model.getContext(),
      };

      // Create the handlers.
      this._modelHandlers = [
        ['reacolo:model:update', () => this.updateStoreFromModel()],
      ];
    }

    getChildContext() {
      return { reacoloModel: model };
    }

    componentWillMount() {
      attachModelHandlers(model, this._modelHandlers);
      // We cannot do this in component did mount or we would trigger a
      // re-render.
      this.updateStoreFromModel();
    }

    componentWillUnmount() {
      detachModelHandlers(model, this._modelHandlers);
    }

    updateStoreFromModel() {
      this.setState({
        store: model.getStore(),
        context: model.getContext(),
      });
    }

    render() {
      return (
        <WrappedComponent
          store={this.state.store}
          context={this.state.context}
          setStore={setStore}
          patchStore={patchStore}
          mergeStore={mergeStore}
          {...this.props}
        />
      );
    }
  }

  Connected.displayName = `Connected(${getDisplayName(WrappedComponent)})`;

  Connected.childContextTypes = {
    reacoloModel: PropTypes.objectOf(PropTypes.func).isRequired,
  };

  return Connected;
};

export default connect;
