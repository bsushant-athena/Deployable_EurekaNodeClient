
/*
 * GET home page.
 */

'use strict';

var eurekaClient = require("../athena-eureka-client");

exports.index = function(req, res){
	
	  res.render('index', { title: 'Express' , 
		  address: eurekaClient.getAllIps()});
	  };

