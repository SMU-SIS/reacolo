import PropTypes from 'prop-types';

export const contextPropType = PropTypes.shape({
  role: PropTypes.string,
  availableRoles: PropTypes.oneOfType([
    PropTypes.objectOf(PropTypes.number),
    PropTypes.arrayOf(PropTypes.string),
  ]),
  status: PropTypes.string.isRequired,
  observers: PropTypes.number,
});

export const modelPropType = PropTypes.shape({
  addListener: PropTypes.func.isRequired,
  removeListener: PropTypes.func.isRequired,
  getContext: PropTypes.func.isRequired,
  getStore: PropTypes.func.isRequired,
  mergeStore: PropTypes.func,
  mergeContext: PropTypes.func,
  setStore: PropTypes.func,
  setContext: PropTypes.func,
  patchStore: PropTypes.func,
  patchContext: PropTypes.func,
});
