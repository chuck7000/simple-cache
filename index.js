var _ = require('underscore');
var moment = require('moment');
var log = {
  debug: require('debug')('SimpleCache.debug')
};

var SimpleCache = module.exports = function(options) {
  if (!options) {
    options = {};
  }

  this.cache = {};
  this.ttl = (options.ttl || 300) * 1000; // default ttl of 300 seconds unless a default is passed as an opt
  if (!options.expirePollTime) {
    options.expirePollTime = this.ttl / 2;
  } else {
    options.expirePollTime = options.expirePollTime * 1000;
  }
  this.extendOnAccess = options.extendOnAccess || true;
  this.maxSize = options.maxSize || 0;
  this.expirePollTime = options.expirePollTime;
  this.startExpirePolling(this.cache);
};

SimpleCache.prototype.set = function(key, val) {
  log.debug(['maxSize:', this.maxSize, ' length: ', _.size(this.cache)].join(''));
  if (this.maxSize > 0 && _.size(this.cache) > 0) {
    var oldestKey = {
      key: '',
      ttl: this.createTTL()
    };
    log.debug('oldest key is: ');
    log.debug(JSON.stringify(oldestKey));
    _.each(this.cache, function(v, k) {
      if (v.ttl < oldestKey.ttl) {
        oldestKey = {
          key: k,
          ttl: v.ttl
        };
      }
    });
    delete this.cache[oldestKey.key];
  }

  this.cache[key] = {
    value: val,
    ttl: this.createTTL()
  };
};

SimpleCache.prototype.get = function(key) {
  if (this.cache[key]) {
    if (this.extendOnAccess) {
      this.cache[key].ttl = this.createTTL();
    }
    return this.cache[key].value;
  }
  return null;
};

SimpleCache.prototype.expire = function(key) {
  if (this.cache[key]) {
    delete this.cache[key];
  }
};

// returns a copy of the cache contents - not a reference to the internal cache becaues
// that would be dangerous and stupid.
SimpleCache.prototype.getCache = function() {
  return _.clone(this.cache);
};

SimpleCache.prototype.createTTL = function() {
  return moment().valueOf() + this.ttl;
};

SimpleCache.prototype.startExpirePolling = function(cache) {
  log.debug(['starting expire polling every ', this.expirePollTime, ' mills'].join(''));
  setInterval(function() {
    log.debug('running expire poll cycle...');
    var now = moment().valueOf();
    log.debug(JSON.stringify(cache));
    _.each(cache, function(v, k) {
      log.debug([v.ttl, ' <= ', now, '?'].join(''));
      if (v.ttl <= now) {
        delete cache[k];
      }
    });
  }, this.expirePollTime);
};
