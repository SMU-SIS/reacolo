import React from 'react';
import ComponentFilter from './ComponentFilter';

const atLeastFilter = (target, context) => (
  target.every(role => context.roleAssignations[role] > 0)
);

const strictFilter = (target, context) => (
  Object.keys(context.roleAssignations).length === target.length
    && atLeastFilter(target, context)
);

const EcologyFilter = (props) => {
  const shouldRender = props.method === 'atLeast' ? atLeastFilter(props.target, props.context)
                                                  : strictFilter(props.target, props.context);
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
