var should = require('should');
var _ = require('underscore');
var moment = require('moment');

var SimpleCache = require('./index');

var createDefaultCache = function() {
  return new SimpleCache();
};

var createCustomeCache = function() {
  return new SimpleCache({
    ttl: 10,
    extendOnAccess: false,
    maxSize: 2
  });
};

var createShortExpCache = function() {
  return new SimpleCache({
    ttl: 1,
    expirePollTime: 1
  });
};

describe('SimpleCache', function() {

  it('should create a cache with a default ttl of 300 seconds', function() {
    var c = createDefaultCache();
    var now = moment().valueOf();
    c.set('a', {});
    var ttl = c.getCache().a.ttl;
    ttl.should.be.aboveOrEqual(now + 300000);
  });

  it('should accept a custom TTL time', function() {
    var c = createCustomeCache();
    var now = moment().valueOf();
    c.set('a', {});
    var ttl = c.getCache().a.ttl;
    ttl.should.be.aboveOrEqual(now + 10000);
    ttl.should.be.belowOrEqual(now + 15000);
  });

  it('should support setting and getting of elements by key', function() {
    var c = createDefaultCache();
    c.set('a', {
      k: 'b'
    });
    var i = c.get('a');
    i.k.should.equal('b');
  });

  it('should remove elements that are expired via expire(key)', function() {
    var c = createDefaultCache();
    c.set('a', {
      k: 'b'
    });
    _.size(c.getCache()).should.equal(1);
    c.expire('a');
    _.size(c.getCache()).should.equal(0);
  });

  it('should extend the ttl on an item when it\'s accessed if extendOnAccess is true',
    function(done) {
      this.timeout(510);
      var c = createDefaultCache();
      c.set('a', {
        k: 'b'
      });
      var ttl = c.getCache().a.ttl;
      setTimeout(function() {
        ttl += 500;
        c.get('a');
        var nttl = c.getCache().a.ttl;
        nttl.should.be.aboveOrEqual(ttl);
        done();
      }, 500);
    });

  it('should not extend access when extendOnAccess is false', function(done) {
    this.timeout(510);
    var c = createDefaultCache();
    c.set('a', {
      k: 'b'
    });
    var ttl = c.getCache().a.ttl;
    setTimeout(function() {
      c.get('a');
      var nttl = c.getCache().a.ttl;
      nttl.should.be.aboveOrEqual(ttl);
      done();
    }, 500);
  });

  it('should expire the oldest item automatically if a new item is added to a cache with a maxSize',
    function(done) {
      var c = createCustomeCache();
      c.set('a', {});
      setTimeout(function() {
        c.set('b');
        c.set('c');
        _.size(c.getCache()).should.equal(2);
        should.exist(c.getCache().b);
        should.exist(c.getCache().c);
        should.not.exist(c.getCache().a);
        done();
      }, 500);
    });

  it('should expire items who\'s TTL has expired when the experation cycle runs', function(done) {
    this.timeout(2000);
    var c = createShortExpCache();
    c.set('a', {});
    setTimeout(function() {
      c.set('b', {});
      _.size(c.getCache()).should.equal(1);
      should.exist(c.getCache().b);
      done();
    }, 1200);
  });
});
