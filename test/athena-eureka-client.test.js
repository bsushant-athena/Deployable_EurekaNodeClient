'use strict';

const expect = require('chai').expect;
const assert = require('chai').assert;
const athenaEurekaClient = require('../athena-eureka-client');
const stubbit = require('stubbit');

describe('#eureka Client', function(){

  it('should export function to get eurekaClient for typescript users', () => {
    const returnedClient = athenaEurekaClient.getEurekaClient();
    expect(returnedClient).to.deep.equal(athenaEurekaClient);
  });

  it('should get ips as an array', function(done){
    const ips = athenaEurekaClient.getAllIps();
    expect(ips).to.have.length.of.at.least(1);
    assert.isArray(ips);
    done();
  });

  it('should be able to connect to eureka server with config', function(done){
    const tempPort = 443;
    const appName = 'node_client';
    const appPort = 3000;
    const eurekaClient = stubbit.requireWithStubs('../athena-eureka-client', 'eureka-js-client');
    const stub = stubbit.getStub(eurekaClient, 'eureka-js-client', 'Eureka');
    process.env.HOST = '10.122.12.122';

    stub.returns({
      start: function() {},
      on: function() {},
    });

    eurekaClient.connect(appName, appPort, function(confign){
      confign.eureka.host = 'localhost';
      confign.eureka.port = tempPort;
      confign.eureka.servicePath = '/eureka/eureka/apps';
      return confign;
    });

    expect(stub.getCall(0).args[0].eureka.port).to.be.equal(tempPort);
    expect(stub.getCall(0).args[0].eureka.host).to.be.equal('localhost');
    done();
  });

  describe('config', () => {
    let ogEnv;

    beforeEach(() => {
      ogEnv = Object.assign({}, process.env);
    });

    afterEach(() => {
      process.env = ogEnv;
    });

    it('defaults config', () => {
      const gatewayConfig = {
        GATEWAY_TOKEN_PATH: 'token-path',
        GATEWAY_CLIENT_ID: 'cid',
        GATEWAY_SECRET: 'serc',
        'eureka.instance.metadataMap.branch': 'branch',
        'eureka.instance.metadataMap.pub': 'true',
        GATEWAY_METADATA_REDIRECTION: 'redirection',
        'eureka.instance.app': 'ATHENA_NODE_CLIENT',
        'eureka.instance.metadataMap.routingUUID': 'something',
      };

      Object.assign(process.env, gatewayConfig);
      let config = athenaEurekaClient.defaultConfig();
      expect(config.auth.clientId).to.equal(gatewayConfig.GATEWAY_CLIENT_ID);
      expect(config.auth.secretKey).to.equal(gatewayConfig.GATEWAY_SECRET);
      expect(config.auth.iamTokenPath).to.equal(gatewayConfig.GATEWAY_TOKEN_PATH);
      expect(config.instance.metadata.branch).to.equal(gatewayConfig['eureka.instance.metadataMap.branch']);
      expect(config.instance.metadata.pub).to.equal(gatewayConfig['eureka.instance.metadataMap.pub']);
      expect(config.instance.metadata.redirection).to.equal(gatewayConfig.GATEWAY_METADATA_REDIRECTION);
      expect(config.instance.app).to.equal(gatewayConfig['eureka.instance.app']);
      expect(config.instance.metadata.routingUUID).to.equal(gatewayConfig['eureka.instance.metadataMap.routingUUID']);

      for (const key of Object.keys(gatewayConfig)) delete process.env[key];
      config = athenaEurekaClient.defaultConfig();
      for (const metaKey of [ 'branch', 'redirection', 'routingUUID' ]) {
        expect(!(metaKey in config.instance.metadata));
      }
      expect(config.instance.metadata.pub).to.equal(false);
      for (const authKey of [ 'clientId', 'iamTokenPath', 'secretKey' ]) {
        expect(authKey in config.auth).to.equal(true);
        expect(config.auth[authKey]).to.equal(undefined);
      }
    });

    it('no extra config for routingUUID', () => {
      const config = athenaEurekaClient.defaultConfig();
      expect(config.instance.metadata.routingUUID).to.equal(undefined);
      for (const metaKey of [ 'branch', 'redirection', 'routingUUID' ]) {
        expect(!(metaKey in config.instance.metadata));
      }
    });
  });
});
