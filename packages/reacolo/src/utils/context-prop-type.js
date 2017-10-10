import PropTypes from 'prop-types';

export default PropTypes.shape({
  role: PropTypes.string,
  availableRoles: PropTypes.oneOfType([
    PropTypes.objectOf(PropTypes.number),
    PropTypes.arrayOf(PropTypes.string),
  ]),
  status: PropTypes.string.isRequired,
  observers: PropTypes.number,
});
