import React from 'react';
// import omit from 'object.omit';
import PropTypes from 'prop-types';
import { lowerizeFirstLetter } from '../utils';
import matchContext from '../filtering/match-context.js';
import connect from '../connect/connect.jsx';

// Regular expression to find the props to match with the context.
const MATCH_REGEXP = /^match(.*)$/;

/**
 * @param {object} props The properties received by a Context component.
 * @return {object} A target object to match agains the context.
 * @private
 */
const contextPropsToTarget = props =>
  Object.entries(props).reduce((target, [pName, pValue]) => {
    // Check if the property should be considered as a context match.
    const reMatch = MATCH_REGEXP.exec(pName);
    if (!reMatch) {
      // If there is no match, return the target object unchanged.
      return target;
    }
    // Extract the name of the property to match.
    const matchProp = reMatch[1];
    if (matchProp) {
      // If the context property to match is named (i.e. this property is named
      // match[contextProp]), append it to the target. Make sure its first
      // letter is lower case.
      // eslint-disable-next-line no-param-reassign
      target[lowerizeFirstLetter(matchProp)] = pValue;
      return target;
    }
    // In case it is the match object (property name === 'match'), it is just
    // merged with the target object.
    return Object.assign(target, pValue);

    // If there is no match, nothing is done.
  }, {});

/**
 * Context component. Renders only if its value matches its match properties.
 * @param {object} props The component's properties.
 * @return {Element} A react element.
 */
export const Context = props => {
  const target = contextPropsToTarget(props);
  const shouldRender = matchContext(props.value, target);
  if (!shouldRender) return null;
  if (props.render) return props.render();
  if (props.component) return <props.component />;
  throw new Error(
    'No render function nor component properties have been provided to <Context>',
  );
};

Context.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  value: PropTypes.object.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  default: PropTypes.bool,
  render: PropTypes.func,
  component: PropTypes.func,
};

Context.defaultProps = {
  default: false,
  render: undefined,
  component: undefined,
};

export default connect(undefined, undefined, context => ({ value: context }))(
  Context,
);
