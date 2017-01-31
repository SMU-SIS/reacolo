import React, { PureComponent } from 'react';
import ComponentFilter from './ComponentFilter';
import contextPropType from './context-prop-type';
import valueGroupsFilter from './filtering/value-groups-filter';
import targetParser from './filtering/target-grammar.pegjs';

const parseTargets = (...args) => targetParser.parse(...args);

class ReacoloFilter extends PureComponent {
  static wouldRender(context, targets) {
    const { roles, activity, clientRole } = context;
    // Build the value / target map. Adapts the context values so that they are all an dictionary
    // of count.
    const valueTargetMap = [
      [(roles || {}), targets.roles],
      [(activity ? { [activity]: 1 } : {}), targets.activity],
      [(clientRole ? { [clientRole]: 1 } : {}), targets.clientRole]
    ];
    // If the decoded boolean is true,
    return valueTargetMap.every(([values, targetGroup]) => {
      if (targetGroup == null) return true;
      const coded = typeof targetGroup === 'string';
      // If the target group is encoded, decode it.
      const decodedTargetGroup = coded ? parseTargets(targetGroup) : targetGroup;
      // Check the filter on this target / value pair.
      return valueGroupsFilter(values, decodedTargetGroup);
    });
  }
  render() {
    const { roles, activity, clientRole, override } = this.props;
    let shouldRender = override;
    if (override == null) {
      shouldRender = this.constructor.wouldRender(
        this.props.context,
        { roles, activity, clientRole }
      );
    }
    return (
      <ComponentFilter rendered={shouldRender}>
        { this.props.children }
      </ComponentFilter>
    );
  }
}

/* eslint-disable react/no-unused-prop-types */
ReacoloFilter.propTypes = {
  context: contextPropType,
  children: React.PropTypes.node.isRequired,
  roles: React.PropTypes.string,
  activity: React.PropTypes.string,
  clientRole: React.PropTypes.string,
  override: React.PropTypes.bool
};
/* eslint-enable react/no-unused-prop-types */

ReacoloFilter.defaultProps = {
  context: undefined,
  roles: undefined,
  activity: undefined,
  clientRole: undefined,
  override: undefined
};

export default ReacoloFilter;
