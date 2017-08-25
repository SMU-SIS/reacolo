/**
 * Create a data registry.
 * @module data-registry
 * @param  {Object} initData - The initial data contained by the registry.
 * @param  {Number} [initRevision=0] - The initial revision id.
 * @return {data-registry~DataRegistry} The data registy
 */
const createDataRegistry = (initData, initRevision = 0) => {
  let data = initData;
  let revision = initRevision;

  /**
   * @interface data-registry~DataRegistry
   */
  return {
    /**
     * Get the data.
     * @memberof data-registry~DataRegistry#
     * @return {Object} The content of the registry.
     */
    get() {
      return data;
    },

    /**
     * Set the data.
     * @memberof data-registry~DataRegistry#
     * @param {Object} newData - The new content of the registry.
     * @return {number|string} The new revision id of the registry.
     */
    set(newData) {
      data = newData;
      revision += 1;
      return revision;
    },

    /**
     * The current revision id of the registry.
     * @memberof data-registry~DataRegistry#
     * @return {number|string} The current revision id of the registry.
     */
    get revision() {
      return revision;
    }
  };
};

module.exports = createDataRegistry;
