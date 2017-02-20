'use strict';

exports.info = function(req, res){
	   res.setHeader('Content-Type', 'application/json');
	   res.send(JSON.stringify({ info: 'hardcoded' }));
};
