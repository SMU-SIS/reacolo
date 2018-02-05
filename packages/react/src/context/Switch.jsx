import React from 'react';
import PropTypes from 'prop-types';
import matchContext from '@reacolo/match';
import createMatcher from './create-matcher.js';
import { Context } from './Context.jsx';
import connect from '../connect/connect.jsx';

/**
 * Switch component. Looks for a matching context amongst its children and
 * only renders this context.
 *
 * @param {object} props The component's properties.
 * @return {Element} A react element.
 */
export const Switch = props => {
  let firstMatchedChild;
  let defaultChild;
  // Loop amongst the children to extract the first matched child and the
  // default child.
  React.Children.forEach(props.children, child => {
    // Once a child has matched, nothing is done anymore.
    if (firstMatchedChild == null && React.isValidElement(child)) {
      const matcher = createMatcher(child.props);
      if (matchContext(props.contextValue, matcher)) {
        firstMatchedChild = child;
      } else if (!defaultChild && child.props.default) {
        defaultChild = child;
      }
    }
  });
  const result = firstMatchedChild || defaultChild;

  // We return a *disconnected* context: no need to connect it, the context
  // has already been fetched.
  return result ? (
    <Context
      {...result.props}
      computedMatch={{ matched: true }}
      // This is not very useful, but avoids a context prop warning.
      contextValue={props.contextValue}
    />
  ) : null;
};

Switch.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  contextValue: PropTypes.object.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]),
};

Switch.defaultProps = {
  children: undefined,
};

// Default export is a <ConnectedCSwitch>, a <Switch> that fetches its value
// automatically from React's context.
export default connect(undefined, undefined, context => ({
  contextValue: context,
}))(Switch);
