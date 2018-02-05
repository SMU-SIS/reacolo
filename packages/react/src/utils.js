import PropTypes from 'prop-types';

/**
 * The prop type of a reacolo model.
 * @private
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
 * @private
 */
export const getDisplayName = Component =>
  Component.displayName || Component.name || 'Component';

/**
 * @param {string} string A string.
 * @return {string} The string with the first letter in lower case.
 * @private
 */
export const lowerizeFirstLetter = string =>
  string.charAt(0).toLowerCase() + string.slice(1);
