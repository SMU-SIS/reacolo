import React from 'react';

const ComponentFilter = (props) => {
  if (!props.rendered) {
    return null;
  }
  return <div>{props.children}</div>;
};

ComponentFilter.propTypes = {
  rendered: React.PropTypes.bool.isRequired,
  children: React.PropTypes.node.isRequired
};

export default ComponentFilter;
