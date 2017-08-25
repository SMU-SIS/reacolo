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
  const setData = model.setAppData.bind(model);
  const patchData = model.patchAppData
    ? model.patchAppData.bind(model)
    : undefined;

  class Connected extends Component {
    constructor(props) {
      super(props);
      this.state = {
        data: model.data || {},
        context: model.context || {},
        isConnected: model.isConnected
      };

      // Create the handlers.
      this._modelHandlers = [
        [Symbol.for('connected'), () => this.updateStateFromModel()],
        [Symbol.for('disconnected'), () => this.updateStateFromModel()],
        [
          Symbol.for('data:update'),
          newData => this.setState({ data: newData })
        ],
        [
          Symbol.for('context:update'),
          newContext => this.setState({ context: newContext })
        ]
      ];
    }

    getChildContext() {
      return { ecologyBroadcaster: model.eventBroadcaster };
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
      const isConnected = model.isConnected;
      this.setState({
        data: isConnected ? model.data : undefined,
        context: model.context,
        isConnected
      });
    }

    render() {
      const { data, context, isConnected } = this.state;
      return (
        <WrappedComponent
          data={data}
          context={context}
          isConnected={isConnected}
          setData={setData}
          patchData={patchData}
          {...this.props}
        />
      );
    }
  }

  Connected.displayName = `Connected(${getDisplayName(
    WrappedComponent
  )})`;

  Connected.childContextTypes = {
    ecologyBroadcaster: PropTypes.objectOf(PropTypes.func).isRequired
  };

  return Connected;
};

export default connect;
