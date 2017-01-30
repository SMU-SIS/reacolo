import React, { PureComponent } from 'react';
import ComponentFilter from './ComponentFilter';
import contextPropType from './context-prop-type';
import valueGroupsFilter from './filtering/value-groups-filter';
import decodeValueGroups from './filtering/decode-targets';

class ReacoloFilter extends PureComponent {
  static wouldRender(context, targets) {
    // Build the value / target map. Adapts the context values so that they are all an dictionary
    // of count.
    const valueTargetMap = [
      [(context.roles ? context.roles : {}), targets.roles],
      [(context.activity ? { [context.activity]: 1 } : {}), targets.activity],
      [(context.clientRole ? { [context.clientRole]: 1 } : {}), targets.clientRole]
    ];
    // If the decoded boolean is true,
    return valueTargetMap.every(([values, targetGroup]) => {
      const coded = !targetGroup || typeof targetGroup === 'string';
      // If the target group is encoded, decode it.
      const decodedTargetGroup = coded ? decodeValueGroups(targetGroup) : targetGroup;
      // Check the filter on this target / value pair.
      return valueGroupsFilter(values, decodedTargetGroup);
    });
  }
  render() {
    const { roles, activity, clientRole } = this.props;
    const shouldRender = this.constructor.wouldRender(
      this.props.context,
      { roles, activity, clientRole }
    );
    return (
      <ComponentFilter rendered={shouldRender}>
        { this.props.children }
      </ComponentFilter>
    );
  }
}

/* eslint-disable react/no-unused-prop-types */
ReacoloFilter.propTypes = {
  context: contextPropType.isRequired,
  children: React.PropTypes.node.isRequired,
  roles: React.PropTypes.string,
  activity: React.PropTypes.string,
  clientRole: React.PropTypes.string
};
/* eslint-enable react/no-unused-prop-types */

ReacoloFilter.defaultProps = {
  roles: undefined,
  activity: undefined,
  clientRole: undefined
};

export default ReacoloFilter;
