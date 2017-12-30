import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import matchContext from '../filtering/match-context.js';
import createMatcher from '../filtering/create-matcher.js';
import connect from '../connect/connect.jsx';

/**
 * Context component. Renders only if its value matches its match properties.
 *
 * @param {object} props The component's properties.
 * @return {Element} A react element.
 */
export const Context = props => {
  // If the match has already been computed (e.g. by <Switch>, the match
  // is bypassed).
  if (props.computedMatch == null) {
    const matcher = createMatcher(props);
    const shouldRender = matchContext(props.contextValue, matcher);
    if (!shouldRender) return null;
  } else if (!props.computedMatch.matched) {
    return null;
  }
  if (props.render) return props.render();
  if (props.component) return <props.component />;
  if (props.children) return <Fragment>{props.children}</Fragment>;
  throw new Error(
    'No render function, component properties nor children have been provided to <Context>',
  );
};

Context.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  contextValue: PropTypes.object.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  default: PropTypes.bool,
  render: PropTypes.func,
  component: PropTypes.func,
  children: PropTypes.node,
  // This is not typically provided manually but by <Switch>.
  computedMatch: PropTypes.shape({ matched: PropTypes.bool.isRequired }),
};

Context.defaultProps = {
  default: false,
  render: undefined,
  component: undefined,
  children: undefined,
  computedMatch: undefined,
};

// Default export is a <ConnectedContext>, a <Context> that fetches its value
// automatically from React's context.
export default connect(undefined, undefined, context => ({
  contextValue: context,
}))(Context);
