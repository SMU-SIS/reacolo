import PropTypes from 'prop-types';

/**
 * The prop type of a reacolo model.
 */
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

/**
 * @param {Component} Component a React component.
 * @return {string} The display name of the component or 'Component' if it could
 * not be fetched.
 */
export const getDisplayName = Component =>
  Component.displayName || Component.name || 'Component';
