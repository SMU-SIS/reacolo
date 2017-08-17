import React, { Component } from 'react';

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

const connect = (WrappedComponent, model) => {
  const setData = model.setAppData.bind(model);

  class ConnectedComponent extends Component {
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

    componentDidMount() {
      attachModelHandlers(model, this._modelHandlers);
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
          {...this.props}
        />
      );
    }
  }

  return ConnectedComponent;
};

export default connect;
