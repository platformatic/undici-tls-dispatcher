'use strict'
const { Agent, Pool } = require('undici')

class UndiciTLSDispatcher extends Agent {
  constructor (options) {
    super({
      ...options,
      factory (url, opts) {
        const found = options.tlsConfig.find((config) => {
          return url.indexOf(config.url) === 0
        })
        if (!found) {
          return new Pool(url, opts)
        }
        return new Pool(url, {
          ...opts,
          connect: { ...opts.connect, ...found.tls }
        })
      }
    })
  }
}

/**
 * Creates a TLS interceptor that can be composed with existing dispatchers
 * to apply TLS configuration based on URL patterns.
 *
 * @param {Array} tlsConfig - Array of TLS configurations with url and tls properties
 * @returns {Function} Interceptor function that can be used with dispatcher.compose()
 */
function TLSInterceptor (tlsConfig) {
  // Create a pool cache to avoid recreating pools for the same host
  const poolCache = new Map()

  return dispatch => {
    return function tlsInterceptor (opts, handler) {
      const url = new URL(opts.origin)
      const origin = opts.origin

      // Check if we have a TLS configuration for this URL
      const found = tlsConfig.find((config) => {
        return origin.indexOf(config.url) === 0
      })

      // If no TLS config found or not HTTPS, use the original dispatch
      if (!found || url.protocol !== 'https:') {
        return dispatch(opts, handler)
      }

      // Get or create a pool with the custom TLS settings
      let pool = poolCache.get(origin)
      if (!pool) {
        pool = new Pool(origin, {
          connect: { ...found.tls }
        })
        poolCache.set(origin, pool)
      }

      // Use the pool's dispatch method instead
      return pool.dispatch(opts, handler)
    }
  }
}

module.exports = UndiciTLSDispatcher
module.exports.TLSInterceptor = TLSInterceptor
