import React from 'react';
import ComponentFilter from './ComponentFilter';
import contextPropType from './context-prop-type';
import { contextFilter, valueType, countType } from './filtering/context-filter';

const ReacoloFilter = (props) => {
  // Build the target props representation to be checked.
  const targetProps = [
    { name: 'activity', value: props.activity, type: valueType },
    { name: 'clientRole', value: props.clientRole, type: valueType },
    { name: 'roles', value: props.roles, type: countType },
  ];
  // Check the context.
  const rendered = contextFilter(props.context, targetProps);
  return (
    <ComponentFilter rendered={rendered}>
      { props.children }
    </ComponentFilter>
  );
};

ReacoloFilter.propTypes = {
  context: contextPropType.isRequired,
  children: React.node.isRequired,
  roles: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.string),
    React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.string))
    // TODO:
    // - React.PropTypes.objectOf(React.PropTypes.number)
    // - React.PropTypes.arrayOf(React.PropTypes.objectOf(React.PropTypes.number))
  ]),
  activity: React.PropTypes.string,
  clientRole: React.PropTypes.string
};

ReacoloFilter.defaultProps = {
  roles: ['*'],
  activity: '*',
  clientRole: '*'
};

export default ReacoloFilter;
