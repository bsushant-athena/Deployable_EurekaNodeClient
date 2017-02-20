Athena EurekaClient

The relevant files are:
Epocrates/Server/Node/athena-eureka-client.js
    A small client implementation that uses eureka-js-client.

Epocrates/Server/Node/app.js
    A minimal web app that uses the client in athenaEurekaClient to connect to a gateway

Epocrates/Server/Node/config/eureka-client.yml
    A minimal configuration file (disregard the commented out lines) that contains the configuration that the athenaEurekaClient needs in order to connect.


1) Client File: athena-eureka-client.js

Functions:
a)var ipAddress = function(value);
    This is a function that has nothing to do with eureka. It just returns an array of valid IP for the server where the code is running.

b)var defaultConfig = function()
    This function simply returns the default config structure, which is a subset of the configuration used by eureka-js-client.

c)var configIp = function(address, callbackFunction)
    This function return the default configuration modified by a callback function (if not null). The address parameter is an IP address that is always used to configure the client IP.

d)var getYaml = function(file)
    Gets a yaml file into a structure

e)exports.connectAllIp = function(configureCallback)
    The actual function provided by the module to connect to a eureka server:
        1) get all the ip addresses of the client
        2) get additional client-specific configuration from the eureka-client.yml file
            if the configureCallback function is null, create a callback function that uses the client specific configuration about the host, port and servicepath of the eureka server
            if the configureCallback function is not null then it used instead of the "default" function described above; the user-provided configureCallback must anyway set the same parameters as the default one
        3) Finally, for each of the addresses gathered at (1), merge the address, the default config and the provided callback (which by default uses the configuration file), and use the merged configuration to connect to the eureka server advertising the address of the service.

f)var doConnect = function(config)
    This function actually is the one that uses the eureka-js-client Eureka object to connect. The config passed by the caller is used to complete a default config for Eureka, that contains values we do not want the user of the client to be able to configure him/herself (smile)



2) Demo Server File: app.js

This is a "dummy" web app, that uses the client. It does three things that at this moment we think the apps that will use the client need to do:

athenaEureka.connectAllIp()
    --  to connect to Eureka
    --  provides two web pages, /info and /health



More info at : https://athenaconfluence.athenahealth.com/display/P2AG/Consideration+on+Eureka-js