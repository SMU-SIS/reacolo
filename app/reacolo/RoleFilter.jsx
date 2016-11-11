import React from 'react';
import ComponentFilter from './ComponentFilter';

const arrayIncludes = Array.prototype.includes;

export default function RoleFilter(props) {
  let shouldRender;
  if (typeof props.target === 'string') {
    shouldRender = props.target === props.context.role;
  } else {
    shouldRender = arrayIncludes.call(props.target, props.context.role);
  }
  return (
    <ComponentFilter rendered={shouldRender}>
      {props.children}
    </ComponentFilter>
  );
}

RoleFilter.propTypes = {
  target: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.arrayOf(React.PropTypes.string)
  ]).isRequired,
  children: React.PropTypes.element.isRequired,
  context: React.PropTypes.shape({
    role: React.PropTypes.string.isRequired
  }).isRequired
};
