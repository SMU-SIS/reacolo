import PropTypes from 'prop-types';

export default PropTypes.shape({
  clientRole: PropTypes.string,
  roles: PropTypes.objectOf(PropTypes.number).isRequired
});
