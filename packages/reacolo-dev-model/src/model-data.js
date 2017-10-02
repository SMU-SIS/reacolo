/**
 * @typedef {number|string} DataRevision
 */

/**
 * ModelData factory.
 * @module module:reacolo-dev-model/model-data
 * @param {object} [options] The ModelData options.
 * @param {string} [options.initClientRole=undefined] The initial client role.
 * @param {object} [options.initServerData=undefined] The initial server data.
 * @param {object} [options.initServerMetaData=undefined] The initial server
 * meta data.
 * @param {func} [options.onModelUpdate=undefined] Callback to be called on
 * updates.
 * @return {module:reacolo-dev-model~ModelData} The model data.
 */
export default ({
  initClientRole,
  initServerData,
  initServerMetaData,
  onUpdate = () => {}
}) => {
  /**
   * The role of this client.
   * @type{string}
   * @private
   */
  let clientRole = initClientRole;

  /**
   * The server's data. The context property does not contain yet the metadata.
   * @type {{ state: Object, context: Object}}
   * @private
   */
  let data;

  /**
   * The current revision id of the data. As much as possible, it must be
   * immutable and support recycling for better performances.
   *
   * @type {DataRevision}
   * @private
   */
  let dataRevision = initServerData;

  /**
   * The server's data. The context property does not contain yet the metadata.
   * @type {{ roles: Array.<string>, observers: number}}
   * @private
   */
  let metaData = initServerMetaData;

  /**
   * The current revision id of the metadata.
   * @type {DataRevision}
   * @private
   */
  let metaDataRevision; // eslint-disable-line no-unused-vars

  /**
   * The model value. This is created by merging all properties the right way.
   * As much as possible, it must be immutable and support recycling for better
   * performances.
   * @type {object}
   * @private
   */
  let value;

  /**
   * @param {string} newClientRole The new client role.
   * @return {boolean} True if the context must be updated.
   * @memberof module:reacolo-dev-model~ModelData#
   */
  const setClientRole = (newClientRole) => {
    if (clientRole === newClientRole) return false;
    clientRole = newClientRole;
    return true;
  };

  /**
   * @param {object} newData The new data.
   * @param {DataRevision} newRevision The revision id of the new data.
   * @return {boolean} True if the context must be updated.
   * @memberof module:reacolo-dev-model~ModelData#
   */
  const setData = (newData, newRevision) => {
    if (data === newData && dataRevision === newRevision) return false;
    const oldData = data;
    data = newData;
    dataRevision = newRevision;
    return !oldData || oldData.context !== newData.context;
  };

  /**
   * @param {object} newMetaData The new meta-data.
   * @param {DataRevision} newRevision The revision id of the new data.
   * @return {boolean} True if the context must be updated.
   * @memberof module:reacolo-dev-model~ModelData#
   */
  const setMetaData = (newMetaData, newRevision) => {
    if (metaData === newMetaData && metaDataRevision === newRevision) {
      return false;
    }
    metaData = newMetaData;
    metaDataRevision = newRevision;
    return true;
  };

  /**
   * Update the model value from the other values.
   *
   * This creates a new value object. For better performances, it should be
   * called only if necessary.
   * @param {boolean} recycleContext - If the context should be recycled.
   * @return {undefined}
   * @private
   */
  const update = (recycleContext = false) => {
    const context = recycleContext
      ? value.context
      : Object.assign({}, data ? data.context : undefined, metaData, {
        clientRole
      });
    value = { context, state: data ? data.state : undefined };
  };

  // Update the model without notifying.
  update(false);

  /**
   * The goal of this object is to control context's mutations by handling
   * data, metadata and clientRole changes.
   *
   * @interface module:reacolo-dev-model~ModelData
   */
  return {
    /**
     * @return {{ context, state }} The current model value.
     * @memberof module:reacolo-dev-model~ModelData#
     */
    get: () => value,

    /**
     * @return {string} The role of this client.
     * @memberof module:reacolo-dev-model~ModelData#
     */
    getClientRole: () => clientRole,

    /**
     * @return {object} The current state.
     * @memberof module:reacolo-dev-model~ModelData#
     */
    getState: () => value.state,

    /**
     * @return {object} The current context.
     * @memberof module:reacolo-dev-model~ModelData#
     */
    getContext: () => value.context,

    /**
     * @return {object} The current data.
     * @memberof module:reacolo-dev-model~ModelData#
     */
    getData: () => data,

    /**
     * @return {DataRevision} The current data revision.
     * @memberof module:reacolo-dev-model~ModelData#
     */
    getDataRevision: () => dataRevision,

    /**
     * @return {object} The current meta-data.
     * @memberof module:reacolo-dev-model~ModelData#
     */
    getMetaData: () => metaData,

    /**
     * @return {DataRevision} The current meta-data revision.
     * @memberof module:reacolo-dev-model~ModelData#
     */
    getMetaDataRevision: () => metaDataRevision,

    /**
     * Set the model data.
     *
     * @param {object} mutation - The mutation to apply.
     * @param {{ value: string }} mutation.clientRole - clientRole mutation.
     * @param {{ value: string, revision: DataRevision }} mutation.data - data
     *  mutation
     * @param {{ value: string, revision: DataRevision }} mutation.metaData -
     * metaData mutation
     * @return {undefined}
     */
    set({
      clientRole: clientRoleMutation,
      data: dataMutation,
      metaData: metaDataMutation
    }) {
      const mustUpdateContext = [
        clientRoleMutation && setClientRole(clientRoleMutation.value),
        dataMutation && setData(dataMutation.value, dataMutation.revision),
        metaDataMutation &&
          setMetaData(metaDataMutation.value, metaDataMutation.revision)
      ];
      update(!mustUpdateContext.some(x => x));
      onUpdate(value);
    }
  };
};
