import except from 'except';
import PropTypes from 'prop-types';

const OMITTED_CONTEXT_PROPS_FROM_TARGETS = ['default', 'children'];
const identity = x => x;

// bindContext HOC.
const bindContext = (propsToTargets = identity) => {
  // Create the context.
  const Context = () => {
    throw new Error('Context components cannot be rendered directly. They must be contained either ' +
      'in a Filter component or a parent Context component.');
  };
  // Define its getTargets function from paramToTargets.
  if (typeof propsToTargets === 'function') {
    Context.getTargets = element =>
      propsToTargets(except(element.props, OMITTED_CONTEXT_PROPS_FROM_TARGETS));
  } else {
    Context.getTargets = element =>
      Object.assign({}, propsToTargets, except(element.props, OMITTED_CONTEXT_PROPS_FROM_TARGETS));
  }

  // Define other properties.
  Context.isDefault = element => !!element.props.default;
  Context.isContext = true;
  Context.propTypes = {
    default: PropTypes.bool,
    children: PropTypes.node
  };
  Context.defaultProps = {
    default: false
  };
  return Context;
};

export default bindContext;
