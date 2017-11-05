import { Component } from 'react';
import propTypes from 'prop-types';

export default (WrappedComponent, portalId, callbackEvents) => {
  class PortalOut extends Component {
    constructor() {
      super();

      // Create the event listeners and mapped them with the corresponding
      // callback name.
      this._listenerEntries = Object.entries(
        callbackEvents,
      ).map(([callbackName, eventName]) => [
        eventName,
        args => {
          const callback = this.props[callbackName];
          if (callback) {
            // Unpack the arguments (that should be packed by origin).
            callback(...args);
          }
        },
      ]);
    }
    componentDidMount() {
      this._listenerEntries.forEach(([eventName, callback]) => {
        this.context.reacoloModel.addListener(eventName, callback);
      });
    }
    componentWillUnmount() {
      this._listenerEntries.forEach(([eventName, callback]) => {
        this.context.reacoloModel.removeListener(eventName, callback);
      });
    }
    render() {
      // The exit of a portal is not rendered. It only emits values.
      return null;
    }
  }
  PortalOut.contextTypes = {
    reacoloModel: propTypes.shape({
      addListener: propTypes.func.isRequired,
      removeListener: propTypes.func.isRequired,
    }).isRequired,
  };
  PortalOut.displayName = `${portalId}.Out`;

  return PortalOut;
};
