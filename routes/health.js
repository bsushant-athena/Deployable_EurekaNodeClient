'use strict';


exports.health = function(req, res){
	   res.setHeader('Content-Type', 'application/json');
	   res.send(JSON.stringify({ status: 'UP' }));
};
