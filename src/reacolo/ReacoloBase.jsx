import React, { Component } from 'react';
import except from 'except';
import contextPropType from './context-prop-type';

export default class ReacoloBase extends Component {

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
    ReacoloBase._attachModelHandlers(model, this._modelHandlers);
  }

  componentWillReceiveProps({ model }) {
    if (this.props.model !== model) {
      ReacoloBase._detachModelHandlers(this.props.model, this._modelHandlers);
      this._fullStateModelUpdate();
      ReacoloBase._attachModelHandlers(model, this._modelHandlers);
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
    const extraProps = except(this.props, Object.keys(this.constructor.propTypes));
    const App = this.props.app;
    return (
      <App
        data={data}
        context={context}
        isConnected={isConnected}
        setData={this._setData}
        {...extraProps}
      />
    );
  }
}

ReacoloBase.propTypes = {
  model: React.PropTypes.shape({
    data: React.PropTypes.object,
    context: contextPropType.isRequired,
    isConnected: React.PropTypes.bool.isRequired,
    setAppData: React.PropTypes.func.isRequired
  }).isRequired,
  app: React.PropTypes.func.isRequired
};
