# undici-tls-dispatcher

An undici dispatcher to enable TLS for given URLs

## Install

```
npm i undici-tls-dispatcher
```

## Usage

### Using the TLS Dispatcher

```js
const UndiciTLSDispatcher = require('undici-tls-dispatcher')
const { request } = require('undici')

const dispatcher = new UndiciTLSDispatcher({
  tlsConfig: [
    {
      url: 'https://yourserver.com',
      tls: {
        ca: '...',
        cert: '...',
        key: '...'
      }
    }
  ]
})

const res = await request(httpsServerUrl, { dispatcher })
...
```

### Using the TLS Interceptor

The library also provides a TLS interceptor that can be applied to an existing dispatcher:

```js
const { request, getGlobalDispatcher, setGlobalDispatcher } = require('undici')
const { TLSInterceptor } = require('undici-tls-dispatcher')

const tlsConfig = [
  {
    url: 'https://yourserver.com',
    tls: {
      ca: '...',
      cert: '...',
      key: '...'
    }
  }
]

// Get the global dispatcher
const originalDispatcher = getGlobalDispatcher()

// Compose the global dispatcher with the TLS interceptor
const enhancedDispatcher = getGlobalDispatcher()
  .compose(TLSInterceptor(tlsConfig))

// Set the enhanced dispatcher as the global dispatcher
setGlobalDispatcher(enhancedDispatcher)

// Use it for requests (no need to specify dispatcher)
const res = await request('https://yourserver.com')
...

// Restore the original dispatcher when done
setGlobalDispatcher(originalDispatcher)
```

See `test.js` for complete examples.

## License

Apache 2.0