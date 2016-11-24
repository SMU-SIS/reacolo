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

const filter = (method, targetOrTargets, context) => {
  const methodFilter = filters[method];
  if (typeof targetOrTargets[0] === 'string') {
    return methodFilter(targetOrTargets, context);
  }
  return targetOrTargets.some(target => methodFilter(target, context));
};

const EcologyFilter = (props) => {
  const shouldRender = filter(props.method, props.target, props.context);
  return (
    <ComponentFilter rendered={shouldRender}>
      { props.children }
    </ComponentFilter>
  );
};

EcologyFilter.propTypes = {
  target: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.string),
    React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.string))
    // TODO:
    // - React.PropTypes.objectOf(React.PropTypes.number)
    // - React.PropTypes.arrayOf(React.PropTypes.objectOf(React.PropTypes.number))
  ]).isRequired,
  method: React.PropTypes.oneOf(['atLeast', 'strict']),
  children: React.PropTypes.node.isRequired,
  context: React.PropTypes.shape({
    roleAssignations: React.PropTypes.objectOf(React.PropTypes.number).isRequired
  }).isRequired
};

EcologyFilter.defaultProps = {
  method: 'atLeast'
};

export default EcologyFilter;
