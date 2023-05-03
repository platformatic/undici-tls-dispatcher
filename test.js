'use strict'

const test = require('node:test')
const assert = require('node:assert')
const https = require('node:https')
const http = require('node:http')
const { request } = require('undici')
const UndiciTLSDispatcher = require('.')
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
