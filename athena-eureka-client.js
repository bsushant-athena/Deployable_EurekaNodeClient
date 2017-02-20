var yaml = require('js-yaml');
var fs = require('fs');
var os = require('os');
var ifaces = os.networkInterfaces();
var Eureka = require('eureka-js-client').Eureka;

/*
 * This function returns an array of all IP addresses here!
 */
var ipAddress = function(value) {
	  var result = [];
		Object.keys(ifaces).forEach(function (ifname) {
		  var alias = 0;
		
		  ifaces[ifname].forEach(function (iface) {
		    if ('IPv4' !== iface.family || iface.internal !== false) {
		      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
		      return;
		    }
		
		    if (alias >= 1) {
		      // this single interface has multiple ipv4 addresses
		      console.log(ifname + ':' + alias, iface.address);
		      result.push(iface.address);
		    } else {
		      // this interface has only one ipv4 adress
		      console.log(ifname, iface.address);
		      result.push(iface.address);
		    }
		    ++alias;
		  });
		});
		return result;
	};
	
/*
 * This is the default configuration object. Callback functions may modify this structure
 * when the eureka connection is established.
 */	
var defaultConfig = function(){
	let config = {
			instance: {
				port: 3000,
				address: 'localhost',
				host: 'localhost',
				name: 'NODE2'
			},
			eureka: {
				host: 'localhost',			
				port: 8080,
				servicePath: '/eureka/eureka/apps'
			}
	};
	return config;
};

/*
 * Actually connect to eureka with a configuration.
 * The configuration can be taken using defaultConfig();
 */
var doConnect = function(config){

	// Create the actual eureka client fromthe configuration, so that 
	// we put the right addresses in the right place.
	var client = new Eureka({
	    instance : {
	        instanceId : config.instance.host,
	        // this should be the one to use, but right now it does not work because the 
	        // netflix code in InstacneRegistry and below does assume that a unmarshalled 
	        // instance info is not a UniqueIdentifier and therefore uses hostname.
	        // TODO: investigate if this is a known issue or if there is some configuration that is not 
	        // understood at this time.	        
//	        instanceId : `${config.instance.address}:${config.instance.name}:${config.instance.port}`,
	        app : config.instance.name,
	        hostName : config.instance.host,
	        ipAddr : config.instance.address,
	        port : {
	            '$' : config.instance.port,
	            '@enabled' : 'true'
	        },
	        homePageUrl : `http://${config.instance.host}:${config.instance.port}/`,
	        statusPageUrl : `http://${config.instance.host}:${config.instance.port}/info`,
	        healthCheckUrl : `http://${config.instance.host}:${config.instance.port}/health`,
	        vipAddress : config.instance.name,
	        secureVipAddress : config.instance.name,
	        dataCenterInfo : {
	            '@class' : 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
	            name : 'MyOwn'
	        }
	    },
	    eureka : {
	        host : config.eureka.host,
	        port : config.eureka.port,
	        servicePath : config.eureka.servicePath || '/eureka/apps/',
	        healthCheckInterval : 5000
	    }
	    });
	
	client.start(function(error){
	console.log(error || `Connected to eureka server ${client.config.eureka.host} with IP ${client.config.instance.ipAddr}`);
	});
};


var configIp = function(address, originalCallbackFunction){
	var configuration = defaultConfig();
	if(originalCallbackFunction){
		configuration = originalCallbackFunction(configuration);
	}
	configuration.instance.address = address;
	configuration.instance.host = address;
	return configuration;
};

var fileExists = function (file) {
	  try {
	    return fs.statSync(file);
	  } catch (e) {
	    return false;
	  }
	}

var getYaml = function(file) {
	  let yml = {};
	  if (!fileExists(file)) {
	    return yml; // no configuration file
	  }
	  try {
	    yml = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
	  } catch (e) {
	    // configuration file exists but was malformed
	    throw new Error(`Error loading YAML configuration file: ${file} ${e}`);
	  }
	  return yml;
	}


/*
 * May use a callback(ipAddress, CONFIG) for additional setup.
 */
exports.connectAllIp = function(configureCallback){
	var addresses = ipAddress();
	var configFile = getYaml('./config/eureka-client.yml');
	console.log(configFile);
	if(!configureCallback){
		configureCallback = function(configuration){
			configuration.eureka.host = configFile.eureka.host;
			configuration.eureka.port = configFile.eureka.port;
			configuration.eureka.servicePath = configFile.eureka.servicePath;
			return configuration;
		}
	}
	for(let s of addresses){	
		doConnect(configIp(s, configureCallback));

	}
};

/*
 * Returns connected ips
 */
exports.getAllIps = function(){
    return ipAddress();
};


