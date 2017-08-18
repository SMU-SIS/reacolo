import { Component } from 'react';
import propTypes from 'prop-types';

export default (WrappedComponent, portalId, callbackEvents) => {
  class PortalOut extends Component {
    constructor() {
      super();

      // Create the event listeners and mapped them with the corresponding
      // callback name.
      this._listenerEntries = Object.entries(
        callbackEvents
      ).map(([callbackName, eventName]) => [
        eventName,
        (args) => {
          const callback = this.props[callbackName];
          if (callback) {
            // Unpack the arguments (that should be packed by origin).
            callback(...args);
          }
        }
      ]);
    }
    componentDidMount() {
      this._listenerEntries.forEach(([eventName, callback]) => {
        this.context.ecologyBroadcaster.subscribe(eventName, callback);
      });
    }
    componentWillUnmount() {
      this._listenerEntries.forEach(([eventName, callback]) => {
        this.context.ecologyBroadcaster.unsubscribe(eventName, callback);
      });
    }
    render() {
      // The exit of a portal is not rendered. It only emits values.
      return null;
    }
  }
  PortalOut.contextTypes = {
    ecologyBroadcaster: propTypes.object.isRequired
  };
  PortalOut.displayName = `portal(${portalId}).Out`;

  return PortalOut;
};
