import React from 'react';
import ComponentFilter from './ComponentFilter';

const filters = {
  atLeast(target, context) {
    return target.every(role => context.roleAssignations[role] > 0);
  },
  strict(target, context) {
    return Object.keys(context.roleAssignations).length === target.length
      && filters.atLeast(target, context);
  }
};

const EcologyFilter = (props) => {
  const shouldRender = filters[props.method](props.target, props.context);
  return (
    <ComponentFilter rendered={shouldRender}>
      {React.Children.only(props.children)}
    </ComponentFilter>
  );
};

EcologyFilter.propTypes = {
  target: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.string),
    // TODO:
    // - React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.string))
    // - React.PropTypes.objectOf(React.PropTypes.number)
  ]).isRequired,
  method: React.PropTypes.oneOf(['atLeast', 'strict']),
  children: React.PropTypes.element.isRequired,
  context: React.PropTypes.shape({
    roleAssignations: React.PropTypes.objectOf(React.PropTypes.number).isRequired
  }).isRequired
};

EcologyFilter.defaultProps = {
  method: 'atLeast'
};

export default EcologyFilter;
