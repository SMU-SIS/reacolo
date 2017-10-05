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
  const setState = (...args) => model.setState(...args);
  const patchState = model.patchState
    ? (...args) => model.patchState(...args)
    : undefined;

  class Connected extends Component {
    constructor(props) {
      super(props);
      this.state = {
        modelState: model.getState(),
        context: model.getContext()
      };

      // Create the handlers.
      this._modelHandlers = [
        ['reacolo:model:update', () => this.updateStateFromModel()]
      ];
    }

    getChildContext() {
      return { reacoloModel: model };
    }

    componentWillMount() {
      attachModelHandlers(model, this._modelHandlers);
      // We cannot do this in component did mount or we would trigger a
      // re-render.
      this.updateStateFromModel();
    }

    componentWillUnmount() {
      detachModelHandlers(model, this._modelHandlers);
    }

    updateStateFromModel() {
      this.setState({
        modelState: model.getState(),
        context: model.getContext()
      });
    }

    render() {
      return (
        <WrappedComponent
          state={this.state.modelState}
          context={this.state.context}
          setState={setState}
          patchState={patchState}
          {...this.props}
        />
      );
    }
  }

  Connected.displayName = `Connected(${getDisplayName(
    WrappedComponent
  )})`;

  Connected.childContextTypes = {
    reacoloModel: PropTypes.objectOf(PropTypes.func).isRequired
  };

  return Connected;
};

export default connect;
