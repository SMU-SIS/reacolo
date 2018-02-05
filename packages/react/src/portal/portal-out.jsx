import { Component } from 'react';
import propTypes from 'prop-types';
import { MODEL_CONTEXT_KEY } from '../constants.js';

export default (WrappedComponent, portalId, callbackEvents) => {
  class PortalOut extends Component {
    constructor() {
      super();

      // Create the event listeners and mapped them with the corresponding
      // callback name.
      this.listenerEntries = Object.entries(callbackEvents).map(
        ([callbackName, eventName]) => [
          eventName,
          args => {
            const callback = this.props[callbackName];
            if (callback) {
              // Unpack the arguments (that should be packed by origin).
              callback(...args);
            }
          },
        ],
      );
    }
    componentDidMount() {
      this.listenerEntries.forEach(([eventName, callback]) => {
        this.context[MODEL_CONTEXT_KEY].addListener(eventName, callback);
      });
    }
    componentWillUnmount() {
      this.listenerEntries.forEach(([eventName, callback]) => {
        this.context[MODEL_CONTEXT_KEY].removeListener(eventName, callback);
      });
    }
    render() {
      // The exit of a portal is not rendered. It only emits values.
      return null;
    }
  }
  PortalOut.contextTypes = {
    [MODEL_CONTEXT_KEY]: propTypes.shape({
      addListener: propTypes.func.isRequired,
      removeListener: propTypes.func.isRequired,
    }).isRequired,
  };
  PortalOut.displayName = `${portalId}.Out`;

  return PortalOut;
};
