import { lowerizeFirstLetter } from '../utils';

// Regular expression to find the props to match with the context.
const MATCH_REGEXP = /^match(.*)$/;

/**
 * Create a matcher object from a set properties, typically the properties
 * received by a <Context> component.
 *
 * @param {object} props The properties.
 * @return {object} A matcher that can be used with `match-context`.
 * @private
 */
export default props =>
  Object.entries(props).reduce((target, [pName, pValue]) => {
    // Check if the property should be considered as a context match.
    const reMatch = MATCH_REGEXP.exec(pName);
    if (!reMatch) {
      // If there is no match, return the target object unchanged.
      return target;
    }
    // Extract the name of the property to match.
    const matchProp = reMatch[1];
    if (matchProp) {
      // If the context property to match is named (i.e. this property is named
      // match[contextProp]), append it to the target. Make sure its first
      // letter is lower case.
      // eslint-disable-next-line no-param-reassign
      target[lowerizeFirstLetter(matchProp)] = pValue;
      return target;
    }
    // In case it is the match object (property name === 'match'), it is just
    // merged with the target object.
    return Object.assign(target, pValue);

    // If there is no match, nothing is done.
  }, {});
