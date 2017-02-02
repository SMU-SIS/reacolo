import React from 'react';

const Context = () => {
  throw new Error('Context components cannot be rendered directly. They must be contained either ' +
    'in a Filter component or a parent Context component.');
};

Context.propTypes = {
  default: React.PropTypes.bool,
  children: React.PropTypes.node
};

Context.defaultProps = {
  default: false
};

export default Context;
