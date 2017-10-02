/**
 * @module reacolo-dev-mode/scope-path
 * @private
 */

/**
 * Modify a patch so that it is applied from a provided base path.
 *
 * @param {string} basePath - The base path.
 * @param {string} patch - An [RFC 6902](http://tools.ietf.org/html/rfc6902)
 * compatible patch.
 * @return {object} A new [RFC 6902](http://tools.ietf.org/html/rfc6902)
 * patch scoped to `basePath`.
 *
 * @example
 * scopePath(
 *   '/state',
 *   [{ op: 'test', path: '/a/b/c', value: 'foo' }]
 * )
 * // Returns [{ op: 'test', path: '/state/a/b/c', value: 'foo' }]
 *
 */
export default function scopePath(basePath, patch) {
  return patch.map(operation =>
    Object.assign({}, operation, {
      path: operation.path != null ? `${basePath}${operation.path}` : undefined,
      from: operation.from != null ? `${basePath}${operation.from}` : undefined
    })
  );
}
