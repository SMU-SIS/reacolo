import React, { Component } from 'react';
import PropTypes from 'prop-types';
import except from 'except';
import contextPropType from './context-prop-type.js';

export default class ConnectHOC extends Component {
  static _attachModelHandlers(model, handlers) {
    handlers.forEach(([evt, handler]) => {
      model.addListener(evt, handler);
    });
  }

  static _detachModelHandlers(model, handlers) {
    handlers.forEach(([evt, handler]) => {
      model.removeListener(evt, handler);
    });
  }

  constructor(props) {
    super(props);
    // Init the state.
    const { model } = props;
    this.state = {
      data: model.data,
      context: model.context,
      isConnected: model.isConnected
    };

    // Create the handlers.
    this._setData = newData => this.props.model.setAppData(newData);
    this._modelHandlers = [
      [Symbol.for('connected'), () => this._fullStateModelUpdate()],
      [Symbol.for('disconnected'), () => this._fullStateModelUpdate()],
      [Symbol.for('data:update'), newData => this.setState({ data: newData })],
      [Symbol.for('context:update'), newContext => this.setState({ context: newContext })]
    ];
    ConnectHOC._attachModelHandlers(model, this._modelHandlers);
  }

  getChildContext() {
    return { ecologyBroadcaster: this.props.model.eventBroadcaster };
  }

  componentWillReceiveProps({ model }) {
    if (this.props.model !== model) {
      ConnectHOC._detachModelHandlers(this.props.model, this._modelHandlers);
      this._fullStateModelUpdate();
      ConnectHOC._attachModelHandlers(model, this._modelHandlers);
    }
  }

  _fullStateModelUpdate(model = this.props.model) {
    const isConnected = model.isConnected;
    if (isConnected) {
      this.setState({
        data: model.data,
        context: model.context,
        isConnected: true
      });
    } else {
      this.setState({
        data: undefined,
        context: undefined,
        isConnected: false
      });
    }
  }

  render() {
    const { data, context, isConnected } = this.state;
    // Extract any extra properties that should be passed to the wrapped component.
    const extraProps = except(this.props, Object.keys(ConnectHOC.propTypes));
    const WrappedComponent = this.props.Component;
    return (
      <WrappedComponent
        data={data}
        context={context}
        isConnected={isConnected}
        setData={this._setData}
        {...extraProps}
      />
    );
  }
}

ConnectHOC.propTypes = {
  model: PropTypes.shape({
    data: PropTypes.object,
    context: contextPropType.isRequired,
    isConnected: PropTypes.bool.isRequired,
    setAppData: PropTypes.func.isRequired,
    eventBroadcaster: PropTypes.shape({
      emit: PropTypes.func.isRequired,
      on: PropTypes.func.isRequired
    })
  }).isRequired,
  Component: PropTypes.func.isRequired
};

ConnectHOC.childContextTypes = {
  ecologyBroadcaster: PropTypes.objectOf(PropTypes.func).isRequired
};
