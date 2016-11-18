import React from 'react';

export default React.PropTypes.shape({
  role: React.PropTypes.string,
  roleAssignations: React.PropTypes.objectOf(React.PropTypes.number).isRequired
});
