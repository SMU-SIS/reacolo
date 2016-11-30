import React from 'react';
import ValueFilter from './ValueFilter';

const RoleFilter = props => (
  <ValueFilter value={props.context.role} target={props.target}>
    { props.children }
  </ValueFilter>
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
