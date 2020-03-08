'use strict';

const LEVELS = {
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
};
const DEFAULT_LEVEL = LEVELS.info;

/*
* logger object which supports 4 basic logging levels
* error,warn,info,debug
*/
const Logger = {

  level: DEFAULT_LEVEL,

  _level: function(inVal) {
    let val = inVal;
    if (val) {
      if (typeof val === 'string') {
        val = LEVELS[val];
      }
      this.level = val || DEFAULT_LEVEL;
    }
    return this.level;
  },

  // Abstract the console call:
  _log: function(method, args) {
    if (this.level <= LEVELS[method === 'log' ? 'debug' : method]) {
      console[method](...args); // eslint-disable-line no-console
    }
  },

  error: function(...args) {
    return this._log('error', args);
  },
  warn: function(...args) {
    return this._log('warn', args);
  },
  info: function(...args) {
    return this._log('info', args);
  },
  debug: function(...args) {
    return this._log('log', args);
  },
};

module.exports = Logger;
