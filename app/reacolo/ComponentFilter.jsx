import React from 'react';

export default function ComponentFilter(props) {
  return props.rendered ? props.children : null;
}

ComponentFilter.propTypes = {
  rendered: React.PropTypes.bool.isRequired,
  children: React.PropTypes.element.isRequired
};
