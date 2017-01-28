const TARGET_SEPARATOR = '&';
const GROUP_SEPARATOR = '|';
const WILDCASE = '*';
const OPTIONAL_SUFFIX = '?';

export const wildcase = Symbol('wildcase');

const convertWildcase = name => (name === WILDCASE ? wildcase : name);

export const decodeValueGroup = (valueGroup) => {
  if (valueGroup == null) return {};
  return valueGroup
    .split(TARGET_SEPARATOR)
    .map(target => target.trim())
    .reduce((res, target) => {
      if (target.endsWith(OPTIONAL_SUFFIX)) {
        const targetName = target
          // Remove the optional suffix.
          .substr(0, target.length - OPTIONAL_SUFFIX.length)
          // Trim only on the right as the left part has already trimmed.
          .trimRight();
        return Object.assign({ [convertWildcase(targetName)]: { optional: true } }, res);
      }
      return Object.assign({ [convertWildcase(target)]: { optional: false } }, res);
    }, {});
};

const decodeValueGroups = valueGroups => ((valueGroups == null) ? (
  [decodeValueGroup()]
) : (
  valueGroups.split(GROUP_SEPARATOR).map(decodeValueGroup)
));

export default decodeValueGroups;
