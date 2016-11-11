import React from 'react';
import ComponentFilter from './ComponentFilter';

export default function RoleFilter(props) {
  let shouldRender;
  if (typeof props.target === 'string') {
    shouldRender = props.target === props.context.role;
  } else {
    shouldRender = props.target.includes(props.context.role);
  }
  return (
    <ComponentFilter rendered={shouldRender}>
      {React.Children.only(props.children)}
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
