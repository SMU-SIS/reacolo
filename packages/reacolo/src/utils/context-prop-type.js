import PropTypes from 'prop-types';

export default PropTypes.shape({
  clientRole: PropTypes.string,
  roles: PropTypes.oneOfType([
    PropTypes.objectOf(PropTypes.number),
    PropTypes.arrayOf(PropTypes.string)
  ]),
  modelStatus: PropTypes.string.isRequired,
  observers: PropTypes.number
});
