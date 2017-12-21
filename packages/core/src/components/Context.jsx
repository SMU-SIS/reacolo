import React from 'react';
// import omit from 'object.omit';
import PropTypes from 'prop-types';
import matchContext from '../filtering/match-context.js';
import createMatcher from '../filtering/create-matcher.js';
import connect from '../connect/connect.jsx';

/**
 * Context component. Renders only if its value matches its match properties.
 * @param {object} props The component's properties.
 * @return {Element} A react element.
 */
export const Context = props => {
  const matcher = createMatcher(props);
  const shouldRender = matchContext(props.contextValue, matcher);
  if (!shouldRender) return null;
  if (props.render) return props.render();
  if (props.component) return <props.component />;
  if (props.children) return props.children;
  throw new Error(
    'No render function nor component properties have been provided to <Context>',
  );
};

Context.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  contextValue: PropTypes.object.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  default: PropTypes.bool,
  render: PropTypes.func,
  component: PropTypes.func,
  children: PropTypes.element,
};

Context.defaultProps = {
  default: false,
  render: undefined,
  component: undefined,
  children: undefined,
};

// Default export is a <ConnectedContext>, a <Context> that fetches its value
// automatically from the React context.
export default connect(undefined, undefined, context => ({
  contextValue: context,
}))(Context);
