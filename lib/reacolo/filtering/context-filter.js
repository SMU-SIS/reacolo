import entries from '../../obj-entries';
import { wildcase } from './decode-targets';

export const valueType = Symbol('single value type');
export const countType = Symbol('value group type');

export const valuesFilter = (values, targetGroup) => {
  const requiredTargets = entries(targetGroup)
    .filter(([, { optional }]) => !optional)
    .map(([value]) => value);

  // If they are missing required targets, we are already done.
  if (!requiredTargets.every(t => values[t] && values[t] > 0)) {
    return false;
  }

  // If there is an optional wildcase, the only thing that matters is that the required
  // targets are here.
  if (targetGroup[wildcase] && targetGroup[wildcase].optional) {
    return true;
  }

  const presentTargetsNb = entries(targetGroup)
    .filter(([, { optional }]) => optional)
    .map(([t]) => t)
    .filter(t => values[t] && values[t] > 0)
    .length + requiredTargets.length;

  const presentValuesNb = entries(values)
    .filter(([, count]) => count > 0)
    .map(([val]) => val)
    .length;

  if (targetGroup[wildcase]) {
    // If the wildcase is not optional, extraneous values are required.
    // (We already now that if there is a wildcase, it is not optional or the function would have
    // already returned).
    return presentTargetsNb < presentValuesNb;
  }
  // If there is no wildcase, we must make sure that there is no extraneous values.
  return presentTargetsNb === presentValuesNb;
};

export const valueGroupsFilter = (counts, groups) => (
  groups.some(group => valuesFilter(counts, group))
);
