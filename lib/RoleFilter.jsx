import React from 'react';
import ComponentFilter from './ComponentFilter';

const filter = (targetOrTargets, role) => {
  if (typeof target === 'string') {
    return targetOrTargets === role;
  }
  return targetOrTargets.includes(role);
};

const RoleFilter = props => (
  <ComponentFilter rendered={filter(props.target, props.context.role)}>
    { props.children }
  </ComponentFilter>
);

RoleFilter.propTypes = {
  target: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.arrayOf(React.PropTypes.string)
  ]).isRequired,
  children: React.PropTypes.node.isRequired,
  context: React.PropTypes.shape({
    role: React.PropTypes.string
  }).isRequired
};

export default RoleFilter;
