import React from 'react';
import ComponentFilter from './ComponentFilter';

const filter = (targetOrTargets, role) => {
  if (Array.isArray(targetOrTargets)) {
    return targetOrTargets.includes(role);
  }
  return targetOrTargets === role;
};

const ValueFilter = props => (
  <ComponentFilter rendered={filter(props.target, props.value)}>
    { props.children }
  </ComponentFilter>
);

/* eslint-disable react/forbid-prop-types */
ValueFilter.propTypes = {
  target: React.PropTypes.oneOfType([
    React.PropTypes.any.isRequired,
    React.PropTypes.arrayOf(React.PropTypes.any.isRequired)
  ]).isRequired,
  children: React.PropTypes.node.isRequired,
  value: React.PropTypes.any
};
/* eslint-enable react/forbid-prop-types */

ValueFilter.defaultProps = {
  value: undefined
};

export default ValueFilter;
