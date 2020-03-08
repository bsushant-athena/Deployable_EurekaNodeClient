# @athena/api-gateway-node-client

## 1.1.0
Added Typescript index.d.ts file, allowing for this package to be used within typescript projects.
A new method has been added to the package for retrieving the client in typescript

```typescript
import { getEurekaClient } from '@athena/api-gateway-node-client';
const athenaEureka = getEurekaClient();
```

## 0.5.0

The config.auth.clientId, .clientSecret, and .iamTokenPath configuration options that are settable in the configureEurekaServerCallback function would be overridden in doConnect with ENV variables (GATEWAY_CLIENT_ID, GATEWAY_CLIENT_SECRET, and GATEWAY_TOKEN_PATH). These ENV variables now only set those keys by default, and modifications to those keys after the configureEurekaServerCallback callback will not be ignored.

The eureka client is now exposed on the athena eureka object. This client is not present until after the register event has been emitted by athena-eureka.

```javascript
const athenaEureka = require('@athena/api-gateway-node-client');

...

athenaEureka.connect(port, config.get('app.name'), null, (defaultEurekaConf) => { ... });

// athenaEureka.client does not currently exist in this scope.

athenaEureka.on('registered', () => {
  // athenaEureka.client is now set on the athenaEureka object.
});

athenaEureka.on('deregistered', () => {
  // this listener will fire when the client has been deregistered.
});

process.on('SIGINT', () => {
  // You can now stop/deregister your instance on process signal.
  athenaEureka.client.stop();
  ...
});
```
