# @athena/api-gateway-node-client


### 1.1.0 

The eureka client is now exposed on the athena eureka object. This client is not present until after the register event has been emitted by athena-eureka.

* Javascript *
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

*Typescript*
```typescript
import { getEurekaClient } from '@athena/api-gateway-node-client';
const athenaEureka = getEurekaClient();
...
```

### 1.1.3
```
Add restriction for service name to not have special character and upgrade to latest eureka-js-client version.
```

##AMS changes
```
access-definition file is the equivalent of IAM service file
fabric.json is required to push the access-definitions into AMS
Command used = fabric app access push --path access-definition.json
More details in https://athenajira.athenahealth.com/browse/P2AG-3051

```