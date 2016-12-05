import React from 'react';

const ComponentFilter = (props) => {
  if (!props.rendered) {
    return null;
  } if (props.wrap) {
    return <div>{props.children}</div>;
  }
  return React.Children.only(props.children);
};

ComponentFilter.propTypes = {
  rendered: React.PropTypes.bool.isRequired,
  children: React.PropTypes.node.isRequired,
  wrap: React.PropTypes.bool,
};

ComponentFilter.defaultProps = {
  wrap: true
};


export default ComponentFilter;
