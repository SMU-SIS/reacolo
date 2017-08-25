
/**
 * Create a data registry: register handle the role of the different clients.
 * Also maintain a revision.
 * @module
 * @return {client-registry~ClientRegistry} The data registy
 */
const createClientRegistry = () => {
  const clients = new Map();
  let revision = 0;

  /**
   * @interface client-registry~ClientRegistry
   */
  return {
    /**
     * Add a client.
     * @memberof client-registry~ClientRegistry#
     * @param {Object} client - A client to add.
     * @param {string} role - The role of the client
     * @return {number|string} The new revision id of the registry.
     */
    addClient(client, role = undefined) {
      revision += 1;
      clients.set(client, role);
      return revision;
    },

    /**
     * Set the role of a client.
     * @memberof client-registry~ClientRegistry#
     * @param {Object} client - The client.
     * @param {string} role - The new role of the client
     * @return {number|string} The new revision id of the registry.
     */
    setClientRole(client, role) {
      revision += 1;
      clients.set(client, role);
      return revision;
    },

    /**
     * Remove a client from the registry.
     * @memberof client-registry~ClientRegistry#
     * @param {Object} client - The client to remove.
     * @return {number|string} The new revision id of the registry.
     */
    removeClient(client) {
      revision += 1;
      clients.delete(client);
      return revision;
    },

    /**
     * Return the list of the roles of the clients.
     * @memberof client-registry~ClientRegistry#
     * @return {string[]} The list of the roles of the clients.
     */
    clientRoles() {
      return Array.from(clients.values()).filter(r => r);
    },

    /**
     * Return the number of observers (client without role).
     * @memberof client-registry~ClientRegistry#
     * @return {number} The number of observers.
     */
    observerCount() {
      return Array.from(clients.values())
        .filter(r => !r)
        .reduce(count => count + 1, 0);
    },

    /**
     * Return the list of clients.
     * @memberof client-registry~ClientRegistry#
     * @return {string[]} The list of  clients.
     */
    clients() {
      return Array.from(clients.keys());
    },

    /**
     * The current revision id of the registry.
     * @memberof client-registry~ClientRegistry#
     * @return {number|string} The current revision id of the registry.
     */
    get revision() {
      return revision;
    },

    /**
     * The size of the registry, i.e. the number of registered clients.
     * @memberof client-registry~ClientRegistry#
     * @return {number} The number of clients in the registry.
     */
    get size() {
      return clients.size;
    }
  };
};

module.exports = createClientRegistry;
