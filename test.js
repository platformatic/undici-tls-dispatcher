'use strict'

const test = require('node:test')
const assert = require('node:assert')
const https = require('node:https')
const http = require('node:http')
const { request, getGlobalDispatcher, setGlobalDispatcher } = require('undici')
const UndiciTLSDispatcher = require('.')
const { TLSInterceptor } = UndiciTLSDispatcher
const { once } = require('events')

const selfsigned = require('selfsigned')
const attrs = [{ name: 'commonName', value: 'localhost' }]
const serverPems = selfsigned.generate(attrs, { days: 365 })

const clientPems = selfsigned.generate([{
  name: 'commonName',
  value: 'client.com'
}], { days: 365 })

test('basic usage', async (t) => {
  const httpsServer = https.createServer({
    requestCert: true,
    rejectUnauthorized: false,
    key: serverPems.private,
    cert: serverPems.cert,
    ca: clientPems.cert
  }, (req, res) => {
    if (!req.client.authorized) {
      res.writeHead(401)
      return res.end('Invalid client certificate authentication.')
    }
    if (req.url === '/whatever') {
      return res.end('hello tls world. Whatever.')
    }
    return res.end('hello tls world')
  })

  httpsServer.listen(0)
  await once(httpsServer, 'listening')

  const httpServer = http.createServer({}, (req, res) => {
    res.end('hello non-tls world')
  })
  httpServer.listen(0)
  await once(httpServer, 'listening')

  const httpsServerUrl = `https://localhost:${httpsServer?.address().port}`
  const httpServerUrl = `http://localhost:${httpServer?.address().port}`

  const dispatcher = new UndiciTLSDispatcher({
    tlsConfig: [
      {
        url: httpsServerUrl,
        tls: {
          ca: serverPems.cert,
          cert: clientPems.cert,
          key: clientPems.private
        }
      }
    ]
  })
  {
    const res = await request(httpsServerUrl, { dispatcher })
    assert.strictEqual(await res.body.text(), 'hello tls world')
  }

  {
    const res = await request(`${httpsServerUrl}/whatever`, { dispatcher })
    assert.strictEqual(await res.body.text(), 'hello tls world. Whatever.')
  }

  {
    const res = await request(httpServerUrl, { dispatcher })
    assert.strictEqual(await res.body.text(), 'hello non-tls world')
  }
  httpsServer.close()
  httpServer.close()
  await dispatcher.close()
})

test('TLSInterceptor usage', async (t) => {
  const httpsServer = https.createServer({
    requestCert: true,
    rejectUnauthorized: false,
    key: serverPems.private,
    cert: serverPems.cert,
    ca: clientPems.cert
  }, (req, res) => {
    if (!req.client.authorized) {
      res.writeHead(401)
      return res.end('Invalid client certificate authentication.')
    }
    if (req.url === '/whatever') {
      return res.end('hello tls world. Whatever.')
    }
    return res.end('hello tls world')
  })

  httpsServer.listen(0)
  await once(httpsServer, 'listening')

  const httpServer = http.createServer({}, (req, res) => {
    res.end('hello non-tls world')
  })
  httpServer.listen(0)
  await once(httpServer, 'listening')

  const httpsServerUrl = `https://localhost:${httpsServer?.address().port}`
  const httpServerUrl = `http://localhost:${httpServer?.address().port}`

  const tlsConfig = [
    {
      url: httpsServerUrl,
      tls: {
        ca: serverPems.cert,
        cert: clientPems.cert,
        key: clientPems.private
      }
    }
  ]

  // Get the original global dispatcher to restore it later
  const originalDispatcher = getGlobalDispatcher()

  // Compose the global dispatcher with our TLS interceptor
  const enhancedDispatcher = getGlobalDispatcher()
    .compose(TLSInterceptor(tlsConfig))

  // Set the enhanced dispatcher as the global dispatcher
  setGlobalDispatcher(enhancedDispatcher)

  try {
    // Use the global dispatcher (no need to specify dispatcher)
    const res = await request(httpsServerUrl)
    assert.strictEqual(await res.body.text(), 'hello tls world')

    // Test another path
    const res2 = await request(`${httpsServerUrl}/whatever`)
    assert.strictEqual(await res2.body.text(), 'hello tls world. Whatever.')

    // Test HTTP request
    const res3 = await request(httpServerUrl)
    assert.strictEqual(await res3.body.text(), 'hello non-tls world')
  } finally {
    // Restore the original dispatcher
    setGlobalDispatcher(originalDispatcher)
    httpsServer.close()
    httpServer.close()
  }
})
