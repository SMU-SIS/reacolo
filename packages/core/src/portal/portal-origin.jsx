import React, { Component } from 'react';
import propTypes from 'prop-types';
import { MODEL_CONTEXT_KEY } from '../constants.js';

export default (WrappedComponent, portalId, callbackEvents) => {
  class Origin extends Component {
    constructor(props, context) {
      super(props);

      // Create the emitters-function that publish a particular event
      // when called-and map them to the corresponding callback name.
      // Callback names will be used as the name of the wrapped component
      // property.
      this.emitters = Object.entries(callbackEvents).reduce(
        (emitters, [callbackName, evtName]) =>
          Object.assign(emitters, {
            [callbackName]: (...args) => {
              // Arguments are packed (sent as an array). PortalOut
              // is supposed to unpack them.
              context[MODEL_CONTEXT_KEY].broadcastEvent(evtName, args);
            },
          }),
        {},
      );
    }
    render() {
      return <WrappedComponent {...this.props} {...this.emitters} />;
    }
  }
  Origin.contextTypes = {
    [MODEL_CONTEXT_KEY]: propTypes.shape({
      broadcastEvent: propTypes.func.isRequired,
    }).isRequired,
  };
  Origin.displayName = `${portalId}.Origin`;

  return Origin;
};
