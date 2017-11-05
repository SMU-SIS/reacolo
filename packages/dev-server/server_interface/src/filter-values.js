/**
 * Filter the properties of an object based on their values.
 * @param {object} object - The object to filter.
 * @param {func} f - The filter function.
 * @return {object} The new object.
 */
export default (object, f) =>
  Object.entries(object)
    .filter(([key, value]) => f(value, key))
    .reduce((result, [key, value]) => {
      result[key] = value; // eslint-disable-line no-param-reassign
      return result;
    }, {});
