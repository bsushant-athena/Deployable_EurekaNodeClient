'use strict';

const yaml = require('js-yaml');
const fs = require('fs');

const fileExists = function (file) {
  try {
    return fs.statSync(file);
  }
  catch (e) {
    return false;
  }
};

module.exports.getYaml = function(file) {
  let yml = {};
  if (!fileExists(file)) {
    return yml; // no configuration file
  }
  try {
    yml = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
  }
  catch (e) {
    // configuration file exists but was malformed
    throw new Error(`Error loading YAML configuration file: ${file} ${e}`);
  }
  return yml;
};
