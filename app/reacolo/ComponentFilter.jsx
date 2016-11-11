import React from 'react';

export default function ComponentFilter(props) {
  return props.rendered ? React.Children.only(props.children) : null;
}

ComponentFilter.propTypes = {
  rendered: React.PropTypes.bool.isRequired,
  children: React.PropTypes.element.isRequired
};
