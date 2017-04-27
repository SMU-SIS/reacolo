import targetParser from './target-grammar.pegjs';
import entries from '../../obj-entries';

const wildcase = '.';

export const valuesFilter = (values, targetGroup) => {
  // Extract every targets strictly required except the wildcase.
  const requiredTargets = targetGroup
    .filter(({ name, optional }) => name !== wildcase && !optional)
    .map(({ name }) => name);

  // If they are missing required targets, the test already failed.
  if (!requiredTargets.every(t => !!values[t])) {
    return false;
  }

  // If there is wildcases and they are all optional (multiple wildcases is odd but who knows), the
  // only thing that matters is that the required targets are here (every other values are
  // acceptable). Hence, the test succeded.
  const wildcaseTarget = targetGroup.filter(({ name }) => name === wildcase);
  if (wildcaseTarget.length > 0 && wildcaseTarget.every(({ optional }) => optional)) {
    return true;
  }

  // Extract the number of targets that are present in values (wildcase and duplicate excepted).
  const presentTargetsNb = new Set(
    targetGroup
      // To go a bit faster, because we know the required targets are all here, we do not check
      // them again.
      .filter(({ name, optional }) => name !== wildcase && optional)
      .map(({ name }) => name)
      .filter(t => !!values[t])
      .concat(requiredTargets)
  ).size;

  // Extract the number of values.
  const presentValuesNb = entries(values)
    .filter(([, count]) => count > 0)
    .map(([val]) => val)
    .length;

  if (wildcaseTarget.length > 0) {
    // If there is a non optional, extraneous values are required.
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

// Decode a target value (if not already decoded) in the format accepted by valueGroupsFilter.
export const decodeTargetVal = (val) => {
  if (typeof val === 'string') {
    return targetParser.parse(val);
  }
  return val;
};

// Decode a context value (if not already decoded) in the form of a dictionnary of count.
export const decodeContextVal = (val) => {
  if (!val) {
    return {};
  } else if (typeof val === 'string') {
    return { [val]: 1 };
  } else if (Array.isArray(val)) {
    return val.reduce((res, elt) => Object.assign(res, { [elt]: 1 }), {});
  }
  return val;
};

// Compare a context object agains a targets object and returns true if the context matches
// the targets.
const wouldPass = (context, targets) => Object.keys(targets).every((targetName) => {
  const targetVal = targets[targetName];
  if (targetVal == null) return true;
  const decodedTargetVal = decodeTargetVal(targetVal);
  const decodedContextVal = decodeContextVal(context[targetName]);
  // Check the filter on this target / value pair.
  return valueGroupsFilter(decodedContextVal, decodedTargetVal);
});

export default wouldPass;
