import React from 'react';

export default React.PropTypes.shape({
  clientRole: React.PropTypes.string,
  activity: React.PropTypes.string,
  roles: React.PropTypes.objectOf(React.PropTypes.number).isRequired
});
