
/*
 * http redirect
 */

exports.redirect301 = function(req, res){
  sendResponse(res, 301);
};

exports.redirect302 = function(req, res){
  sendResponse(res, 302);
};

exports.redirect303 = function(req, res){
  sendResponse(res, 303);
};

exports.redirect305 = function(req, res){
  sendResponse(res, 307);
};

/**
* Common function for sending response
*/
function sendResponse(res, httpStatus) {
    res.redirect(httpStatus,'https://localhost/redirect.html');
    res.end();
};


