# undici-tls-dispatcher

An undici dispatcher to enable TLS for given URLs

## Install

```
npm i undici-tls-dispatcher
```

## Usage

```js
const UndiciTLSDispatcher = require('undici-tls-dispatcher')
const dispatcher = new UndiciTLSDispatcher({
  tlsConfig: [
    {
      url: 'https://yourserver.com',
      tls: {
        ca: '...'
        cert: '...'
        key: '...'
      }
    }
  ]
})

const res = await request(httpsServerUrl, { dispatcher })
...
```

See `test.js` for a complete example.
## License

Apache 2.0