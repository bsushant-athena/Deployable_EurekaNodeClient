'use strict';

const os = require('os');
const ifaces = os.networkInterfaces();

/*
 * This function returns an array of all IP addresses here!
 */

const ipAddress = function() {
  const result = [];

  Object.keys(ifaces).forEach(function (ifname) {
    let alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        //console.log(ifname + ':' + alias, iface.address); // eslint-disable-line no-console
        result.push(iface.address);
      }
      else {
        // this interface has only one ipv4 adress
        //console.log(ifname, iface.address); // eslint-disable-line no-console
        result.push(iface.address);
      }
      ++alias;
    });
  });
  return result;
};

exports.getIp = function () {
  return ipAddress();
};
