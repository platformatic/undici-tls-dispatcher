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

module.exports = UndiciTLSDispatcher
