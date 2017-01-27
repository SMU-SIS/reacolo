// TODO: make decoding independent from the filtering.
import values from 'object-values';

export const valueType = Symbol('single value type');
export const countType = Symbol('value group type');

const TARGET_SEPARATOR = '&';
const GROUP_SEPARATOR = '|';
const WILD_CASE = '*';
const OPTIONAL = '?';
const OPTIONAL_WILD_CASE = WILD_CASE + OPTIONAL;

export const valueFilter = (value, targets) => (
  !targets || targets
    .split(GROUP_SEPARATOR)
    .map(t => t.trim())
    .some(t => t === value || (t === WILD_CASE && value))
);

const singleCountFilter = (counts, target) => {
  let wildCaseIsHere = false;
  let optionalWildCaseIsHere = false;
  let found = 0;

  // Check if the required name targets all have a count > 0 if not optional.
  // Also set up the wildCaseIsHere, wildCaseIsOptional and the found values (side effects :-/).
  const allThere = target
    .split(TARGET_SEPARATOR)
    .map(val => val.trim())
    .every((val) => {
      if (val === WILD_CASE) {
        wildCaseIsHere = true;
      } else if (val === OPTIONAL_WILD_CASE) {
        optionalWildCaseIsHere = true;
      } else if (counts[val] > 0) {
        found += 1;
      } else if (val.endsWith(OPTIONAL)) {
        const base = val.substr(0, val.length - OPTIONAL.length);
        if (counts[base] > 0) found += 1;
      } else {
        return false;
      }
      return true;
    });

  if (!allThere) {
    // If there is missing non optional named targets, then the filter has not passed.
    return false;
  } else if (optionalWildCaseIsHere) {
    // If there is an optional wild case, then as long as all required named targets have been
    // found, we are good.
    return true;
  } else if (wildCaseIsHere) {
    // If the wild case is not optional, then the number of non null values must be greater than
    // what has been found (i.e. there is more).
    return values(counts).filter(v => v > 0).length > found;
  }
  // If there is no wild case, then we must ensure that there is no more than the named targets.
  return values(counts).filter(v => v > 0).length === found;
};

export const countFilter = (counts, targets) => (
  targets
    .split(GROUP_SEPARATOR)
    .some(target => singleCountFilter(counts, target))
);

export const contextFilter = (context, targetProps) => {
  targetProps.every(({ name, value, type }) => {
    const filter = type === countType ? countFilter : valueFilter;
    return filter(value, context[name]);
  });
};
