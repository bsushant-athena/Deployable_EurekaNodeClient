'use strict';

const merge = require('lodash.merge');
const Eureka = require('eureka-js-client').Eureka;
const getYaml = require('./lib/getYaml.js').getYaml;
const getIp = require('./lib/getIp.js').getIp;
const Logger = require('./lib/logger');
const ServiceTokenManager = require('@athena/iam-service-token-manager');
const TokenRequester = require('@athena/uiam-token-requester');
const validUrl = require('valid-url');
const request = require('request');
const events = require('events');
const fs = require('fs');
const jsonQuery = require('json-query');
const util = require('util');
const gatewayScope = ( process.env['GATEWAY_SCOPE'] === null ||  process.env['GATEWAY_SCOPE'] === 'undefined' ) ? 'gateway.register' : process.env['GATEWAY_SCOPE'];// P2AG-4436
const specialCharSet = /^([a-zA-Z0-9._-]+)$/;

const EurekaClient = function() {

  events.EventEmitter.call(this);
  const self = this;

  /*
     * This is the default configuration object. Callback functions may modify this structure
     * when the eureka connection is established.
  */
  const defaultConfig = function(){
    const gatewayMetadataBranch = typeof process.env['eureka.instance.metadataMap.branch']  !== 'undefined' ? process.env['eureka.instance.metadataMap.branch']  : process.env.GATEWAY_METADATA_BRANCH;

    let gatewayMetadataPub = typeof process.env['eureka.instance.metadataMap.pub']  !== 'undefined' ? process.env['eureka.instance.metadataMap.pub']  : process.env.GATEWAY_METADATA_PUB;
    if (typeof gatewayMetadataPub === 'undefined'){
      gatewayMetadataPub = false;
    }
    const routeUUID = typeof process.env['eureka.instance.metadataMap.routingUUID']  !== 'undefined' ?  process.env['eureka.instance.metadataMap.routingUUID']  : process.env.GATEWAY_ROUTING_UUID;
    const config = {
      instance: {
        app: 'ATHENA_NODE_CLIENT',
        hostName: 'localhost',
        ipAddr: 'localhost',
        port: 3000,
        vipAddress: 'ATHENA_NODE_CLIENT',
        secureVipAddress: 'ATHENA_NODE_CLIENT',
        dataCenterInfo: {
          '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          name: 'MyOwn',
        },
        metadata: {
          branch: gatewayMetadataBranch,
          pub: gatewayMetadataPub,
          redirection: process.env['GATEWAY_METADATA_REDIRECTION'],
          routingUUID: routeUUID,
        },
      },
      eureka: {
        host: 'localhost',
        port: 443,
        servicePath: '/eureka/apps/',
        maxRetries: 5,
        requestRetryDelay: 500,
      },
      auth: {
        clientId: process.env['GATEWAY_CLIENT_ID'],
        secretKey: process.env['GATEWAY_SECRET'],
        scope: gatewayScope,
        iamTokenPath: process.env['GATEWAY_TOKEN_PATH'],
      },
      bearerToken: {
        token: undefined,
        expiry: 0,
      },
    };

    // For compatibility with the old method. These keys previously were only added when defined. The above
    // defaults will add them unconditionally.
    for (const key of [ 'branch', 'pub', 'redirection', 'routingUUID' ]) {
      if (config.instance.metadata[key] === undefined) delete config.instance.metadata[key];
    }

    return config;
  };

  // expose the config function;
  this.defaultConfig = defaultConfig;

  /*
     * Actually connect to eureka with a configuration.
     * The configuration can be taken using defaultConfig();
     */
  const doConnect = function(config) {

    // Lookup AUTH env vars and if present add auth to registration requests
    const userName = config.auth.clientId;
    const secretKey = config.auth.secretKey;
    if (
      config.auth.tokenRequester
        || (
          userName !== undefined
            && secretKey !== undefined
            && config.eureka.servicePath !== undefined
        )
    ) {
      addAuthToRegistration(config);
    }
    else {
      Logger.debug('Warning: Services will need to connect to private registration endpoint with valid auth creds sooner');
      startClient(config);
    }
  };

  let serviceTokenManager;

  function addAuthToRegistration(config) {
    if (!serviceTokenManager) {
      let tokenRequester = config.auth.tokenRequester;
      if (!tokenRequester) {
        let iamTokenPath = config.auth.iamTokenPath;
        if ( iamTokenPath === undefined ) {
          iamTokenPath = '/public/iam/oauth2/v1/token';
        }
        let tokenPath;
        if ( validUrl.isWebUri(iamTokenPath) ) {
          tokenPath = iamTokenPath;
        }
        else {
          let scheme = 'http';
          Logger.info('config.eureka.ssl --> ' + config.eureka.ssl);
          if ( config.eureka.ssl === true || config.eureka.ssl === 'true' ) {
            scheme = 'https';
          }
          tokenPath = scheme + '://' + config.eureka.host + ':' + config.eureka.port + iamTokenPath;
        }
        config.auth.iamTokenPath = tokenPath;
        tokenRequester = new TokenRequester({
          clientId: config.auth.clientId,
          clientSecret: config.auth.secretKey,
          scopes: gatewayScope,
          tokenEndpointUrl: config.auth.iamTokenPath,
          retryStrategy: () => ({
            retries: 1,
            minTimeout: 13000,
            maxTimeout: 300000,
          }),
        });
      }
      tokenRequester.on('tokenRequestRetry', (event) => {
        Logger.info(`Token request failed with retryable error ${event.error}, will try again.`);
      });
      serviceTokenManager = new ServiceTokenManager({
        scopes: gatewayScope,
        tokenRequester,
      });
    }

    config.requestMiddleware = (requestOpts, done) => {
      serviceTokenManager.getAccessToken()
        .then((accessToken) => {
          requestOpts.auth = {
            bearer: accessToken,
          };
          done(requestOpts);
        }, (error) => {
          Logger.error('Error - ' + error);
          done(error);
        });
    };
    startClient(config);
  }

  function startClient(config) {


    Logger.debug('Connecting to server with config \n');
    Logger.debug(util.inspect(config, false, null));
    const client = new Eureka(config);
    //client.logger.level('debug');
    client.start(function(error) {

      Logger.info(error || `Connected to eureka server ${client.config.eureka.host} with IP ${client.config.instance.ipAddr}`);
      if (error) {
        self.emit('registerFailed', error);
      }
    });

    client.on('started', function() {
      self.emit('started');
    });


    client.on('registered', function() {
      self.emit('registered');
    });


    client.on('deregistered', function() {
      self.emit('deregistered');
    });


    client.on('heartbeat', function() {
      self.emit('heartbeat');
    });

    client.on('registryUpdated', function() {
      self.emit('registryUpdated');
    });

    self.client = client;
  }

  const configIp = function(address, port, applicationName, configureEurekaServerCallback) { // eslint-disable-line max-params
    let configuration = defaultConfig();
    if (configureEurekaServerCallback){
      configuration = configureEurekaServerCallback(configuration);
    }
    // Create the actual eureka client from the configuration, so that
    // we put the right addresses in the right place.
    configuration.instance.ipAddr = address;
    configuration.instance.hostName = address;
    const appName = typeof process.env['eureka.instance.app']  !== 'undefined' ?  process.env['eureka.instance.app'] : applicationName;
    configuration.instance.app = appName;
    const containerPortKey = 'PORT_' + port;
    const containerPort = process.env[containerPortKey];
    let portVal = 0;
    if (containerPort === undefined) {
      Logger.debug(`Connecting using argument port ${port}`);
      configuration.instance.port = { $: port,
                                      '@enabled': 'true',
      };
      portVal = port;
    }
    else {
      Logger.debug(`Connecting using container port ${containerPort} for argument port ${port}`);
      configuration.instance.port = { $: containerPort,
                                      '@enabled': 'true',
      };
      portVal = containerPort;
    }

    configuration.instance.homePageUrl = `http://${configuration.instance.hostName}:${portVal}/`;
    configuration.instance.statusPageUrl = `http://${configuration.instance.hostName}:${portVal}/info`;
    configuration.instance.healthCheckUrl = `http://${configuration.instance.hostName}:${portVal}/health`;
    configuration.instance.instanceId = `${configuration.instance.ipAddr}:${configuration.instance.app}:${portVal}`;
    configuration.instance.metadata.instanceId = `${configuration.instance.ipAddr}:${configuration.instance.app}:${portVal}`;
    configuration.instance.vipAddress = appName;
    configuration.instance.secureVipAddress = appName;

    Logger.debug('Setting eureka.maxRetries to : ' + Number.MAX_SAFE_INTEGER);
    configuration.eureka.maxRetries = Number.MAX_SAFE_INTEGER;

    Logger.debug(util.inspect(configuration, false, null));

    Logger.debug('Adding dockerImageName header');

    return configuration;
  };

    /*
    *Get config from env variables
    */
  const configEnv = function() {
    const envConfig = {
      eureka: {},
      instance: {},
    };

    const isGatewayRootUrlValid = false;

    if (!isGatewayRootUrlValid) {
      const eurekaHostKey = 'EUREKA_HOST';
      const eurekaHost = process.env[eurekaHostKey];
      if (eurekaHost === undefined) { }
      else {
        Logger.debug(`Connecting using env variable for EUREKA_HOST ${eurekaHost}`);
        envConfig.eureka.host = eurekaHost;
      }

      const eurekaPortKey = 'EUREKA_PORT';
      const eurekaPort = process.env[eurekaPortKey];
      if (eurekaPort === undefined) {}
      else {
        Logger.debug(`Connecting using env variable for EUREKA_PORT ${eurekaPort}`);
        envConfig.eureka.port = eurekaPort;
      }

      const eurekaPathKey = 'EUREKA_PATH';
      const eurekaPath = process.env[eurekaPathKey];
      if (eurekaPath === undefined) { }
      else {
        Logger.debug(`Connecting using env variable for EUREKA_PATH ${eurekaPath}`);
        envConfig.eureka.servicePath = eurekaPath;
      }
    }

    const eurekaDockerImageKey = 'MARATHON_APP_DOCKER_IMAGE';
    const eurekaDockerImage = process.env[eurekaDockerImageKey];
    if (eurekaDockerImage !== undefined) {
      Logger.debug('Connecting using env variable for MARATHON_APP_DOCKER_IMAGE ${eurekaDockerImage}');
      envConfig.instance.metadata = {
        dockerImage: eurekaDockerImage,
      };
    }

    return envConfig;
  };

  const setHostPort = function (port) {
    const hostPortKey = 'PORT_' + port;
    const hostPort = process.env[hostPortKey];
    Logger.debug(`HostPort value=${hostPort}`);
    if (hostPort === undefined) {
      const filePath = process.env.ECS_CONTAINER_METADATA_FILE || '';
      if (!filePath) {
        Logger.info('Unable to read ECS Container Metadata File. Be sure you have set ECS_ENABLE_CONTAINER_METADATA');
        return;
      }
      const ecsData = fs.readFileSync(filePath, 'utf8');
      const result = jsonQuery(
        `PortMappings[ContainerPort=${port}].HostPort`,
        { data: JSON.parse(ecsData) }
      ).value;
      if (!result) {
        Logger.info('Unable to parse ECS Container Metadata File');
        return;
      }
      process.env[hostPortKey] = result;
    }
    else {
      Logger.info('HOST PORT value is passed as an environment variable so taking that instead of reading from metadata file!');
    }
  };

  /*
     * May use a callback(appPort, appName, CONFIG) for additional setup.
     */
  this.connect = function(appPort, appName, fileLocation, configureEurekaServerCallback) { // eslint-disable-line max-params
    let addresses = getIp();
    let containerIp = process.env['HOST'];
    setHostPort(appPort);
    if (!(specialCharSet.test(appName))){
      Logger.error(`Service name contains special character!`);
      return;
    }
    const connectWithIP = function (err) {
      if (err) {
        Logger.error('Error while fetching hostip using AWS metadata api!');
        Logger.error(JSON.stringify(err));
        //return;
      }
      const configFile = getYaml(fileLocation);
      Logger.debug(configFile);
      if (!configureEurekaServerCallback){
        configureEurekaServerCallback = function(configuration) {
          const envConfig = configEnv();
          const defConfig = defaultConfig();
          // apply config overrides in appropriate order
          configuration = merge({}, defConfig, configFile, envConfig);
          return configuration;
        };
      }
      for (const address of addresses){
        doConnect(configIp(address, appPort, appName, configureEurekaServerCallback));
      }
    };



    if (!containerIp) {
      //P2AG-1674
      Logger.debug(`ContainerIP not found from env HOST variable, looking using AWS metadata api`);
      return request('http://169.254.169.254/latest/meta-data/local-ipv4', (err, response, body) => {
        if (!err && response && response.statusCode === 200) {
          const hostIp = body;
          Logger.info(`Running on host ${hostIp}`);
          if (hostIp === 'unknown') {
            Logger.debug('Could not determine AWS host IP!');
          }
          else {
            //if found a hostIp from AWS, setting that as the value of env var HOST
            containerIp = hostIp;
            process.env['HOST'] = hostIp;
            addresses = [ containerIp ];
          }
          connectWithIP();
        }
        else {
          //error occured
          connectWithIP(err);
        }
      });
    }
    else {
      Logger.debug(`Connecting using env variable HOST ${containerIp} `);
      addresses = [ containerIp ];
      connectWithIP();
    }
  };

  /*
     * Returns connected ips
     */
  this.getAllIps = function getAllIps(){
    return getIp();
  };

};

util.inherits(EurekaClient, events.EventEmitter);

const athenaEurekaClient = new EurekaClient();

/**
* CommonJS singleton class imports for NodeJS
*
* const athenaEureka = require('@athena/api-gateway-node-client');
*/
module.exports = athenaEurekaClient;

/**
* ES2015 singleton class import for Typescript
*
* import { getEurekaClient } from '@athena/api-gateway-node-client';
* const athenaEureka = getEurekaClient();
*/
module.exports.getEurekaClient = () => athenaEurekaClient;

//Adding an EOF line
