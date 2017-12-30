import targetParser from './matcher-grammar.pegjs';
import { WILD_CASE } from '../constants';

/**
 * @param {Object<string, number>} decodedContextProperty The decoded context
 * property
 * @param {{name: string, optional: boolean}} matcherPropertyTarget The
 * decoded matcher property
 * @return {boolean} If the matcher property match the context.
 * @private
 */
export const matchContextPropertyTarget = (
  decodedContextProperty,
  matcherPropertyTarget,
) => {
  // Extract every targets strictly required except the wildcase.
  const requiredTargets = matcherPropertyTarget
    .filter(({ name, optional }) => name !== WILD_CASE && !optional)
    .map(({ name }) => name);

  // If they are missing required targets, the test already failed.
  if (!requiredTargets.every(t => !!decodedContextProperty[t])) {
    return false;
  }

  // If there is wildcases and they are all optional (multiple wildcases is odd
  // but who knows), the only thing that matters is that the required targets
  //  are here (every other values are acceptable). Hence, the test succeeded.
  const wildcaseTarget = matcherPropertyTarget.filter(
    ({ name }) => name === WILD_CASE,
  );
  if (
    wildcaseTarget.length > 0 &&
    wildcaseTarget.every(({ optional }) => optional)
  ) {
    return true;
  }

  // Extract the number of targets that are present in values (wildcase and
  //  duplicate excepted).
  const presentTargetsNb = new Set(
    matcherPropertyTarget
      // To go a bit faster, because we know the required targets are all here,
      // we do not check them again.
      .filter(({ name, optional }) => name !== WILD_CASE && optional)
      .map(({ name }) => name)
      .filter(t => !!decodedContextProperty[t])
      .concat(requiredTargets),
  ).size;

  // Extract the number of values.
  const presentValuesNb = Object.entries(decodedContextProperty).filter(
    ([, count]) => count > 0,
  ).length;

  if (wildcaseTarget.length > 0) {
    // If there is a non optional, extraneous values are required.
    // (We already now that if there is a wildc already returned).
    return presentTargetsNb < presentValuesNb;
  }
  // If there is no wildcase, we must make sure that there is no extraneous
  // values.
  return presentTargetsNb === presentValuesNb;
};

/**
 * @param {Object<string, number>} decodedContextProperty The decoded context
 * property
 * @param {{name: string, optional: boolean}[]} decodedMatcherProperty The
 * decoded matcher property
 * @return {boolean} If the matcher property match the context.
 * @private
 */
export const matchContextProperty = (
  decodedContextProperty,
  decodedMatcherProperty,
) =>
  decodedMatcherProperty.some(group =>
    matchContextPropertyTarget(decodedContextProperty, group),
  );

/**
 * Decode a target value (if not already decoded) in the format accepted
 * @param {string} prop The property to decode.
 * @return {{name: string, optional: boolean}[]} The logical groups to match,
 * in a format accepted by valueGroupsFilter.
 * @private
 */
export const decodeMatcherProperty = prop => {
  if (typeof prop === 'string') {
    return targetParser.parse(prop);
  }
  return prop;
};

/**
 * Decode a context property to be matched against.
 *
 * @param {string|string[]|Object<string, number>} prop The value to decode.
 * @return {Object<string, number>} An object whose keys are the different
 * values of the property and the values are the number of times this value
 * is encountered in the context property.
 * @private
 */
export const decodeContextProperty = prop => {
  if (!prop) {
    return {};
  } else if (typeof prop === 'string') {
    return { [prop]: 1 };
  } else if (Array.isArray(prop)) {
    return prop.reduce((res, elt) => Object.assign(res, { [elt]: 1 }), {});
  }
  return prop;
};

/**
 * Compare a context object against a targets object and returns true if the
 * context matches the targets.
 * @param {object} context The context to match
 * @param {object} matcher The context matcher
 * @return {boolean} If the context matches the matcher.
 * @private
 */
const matchContext = (context, matcher) =>
  Object.keys(matcher).every(targetName => {
    const targetVal = matcher[targetName];
    if (targetVal == null) return true;
    const decodedContextProp = decodeContextProperty(context[targetName]);
    const decodedMatcherProp = decodeMatcherProperty(targetVal);
    // Check the filter on this target / value pair.
    return matchContextProperty(decodedContextProp, decodedMatcherProp);
  });

export default matchContext;
